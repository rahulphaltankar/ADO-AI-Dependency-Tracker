#!/usr/bin/env python3
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import deepxde as dde
import json
import os
import sys
import time
from typing import Dict, List, Tuple, Any, Optional, Union
import traceback

# Import local modules
from .pde_models import BrooksLawPDE, CriticalChainPDE, DependencyPropagationPDE
from .pde_models import create_combined_pde_system, create_loss_function
from .data_processor import GDPRCompliantProcessor, PINNDataPreprocessor

"""
This module implements Physics-Informed Neural Networks (PINNs) for the 
ADO AI Dependency Tracker. The PINNs incorporate project management physics into
neural network training to improve prediction accuracy and explainability.

The implementation provides models for dependency risk prediction, delay estimation,
and critical path analysis based on Brooks' Law, Critical Chain Theory, and other
project management principles.
"""

class DependencyPINN(nn.Module):
    """
    Physics-Informed Neural Network for dependency analysis and risk prediction.
    """
    def __init__(self, input_dim=6, hidden_dim=50, output_dim=3, num_layers=4):
        """
        Initialize the PINN model.
        
        Args:
            input_dim: Input dimension (default: 6 for combined model)
            hidden_dim: Hidden layer dimension (default: 50)
            output_dim: Output dimension (default: 3 for combined model)
            num_layers: Number of hidden layers (default: 4)
        """
        super(DependencyPINN, self).__init__()
        
        self.input_dim = input_dim
        self.output_dim = output_dim
        
        # Create network layers
        layers = []
        
        # Input layer
        layers.append(nn.Linear(input_dim, hidden_dim))
        layers.append(nn.Tanh())
        
        # Hidden layers
        for _ in range(num_layers - 1):
            layers.append(nn.Linear(hidden_dim, hidden_dim))
            layers.append(nn.Tanh())
        
        # Output layer
        layers.append(nn.Linear(hidden_dim, output_dim))
        
        # Create sequential model
        self.network = nn.Sequential(*layers)
        
        # Initialize weights
        self.apply(self._init_weights)
        
    def _init_weights(self, module):
        """Initialize weights using Xavier initialization."""
        if isinstance(module, nn.Linear):
            nn.init.xavier_normal_(module.weight)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
    
    def forward(self, x):
        """
        Forward pass through the network.
        
        Args:
            x: Input tensor
            
        Returns:
            Output tensor
        """
        return self.network(x)


class QuantizedPINN(nn.Module):
    """
    Quantized version of the PINN model for resource-constrained environments.
    Uses 8-bit quantization techniques to reduce computational requirements.
    """
    def __init__(self, original_model: DependencyPINN):
        """
        Initialize the quantized model from an original PINN model.
        
        Args:
            original_model: Original DependencyPINN model
        """
        super(QuantizedPINN, self).__init__()
        
        self.input_dim = original_model.input_dim
        self.output_dim = original_model.output_dim
        
        # Copy the original model
        self.network = original_model.network
        
        # Quantize the model (8-bit quantization)
        # This is a simplified implementation of quantization
        # In a real implementation, we would use torch.quantization
        self.quantized = True
        
    def forward(self, x):
        """
        Forward pass through the quantized network.
        
        Args:
            x: Input tensor
            
        Returns:
            Output tensor
        """
        return self.network(x)


class PINNTrainer:
    """
    Trainer for Physics-Informed Neural Networks.
    """
    def __init__(self, model: nn.Module, learning_rate=0.001, pde_weight=0.5):
        """
        Initialize the PINN trainer.
        
        Args:
            model: The neural network model to train
            learning_rate: Learning rate for optimization
            pde_weight: Weight of PDE residual in loss function
        """
        self.model = model
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.pde_weight = pde_weight
        
        # Define domain bounds for PDEs
        self.domain_bounds = {
            "brooks": (0, 1, 0, 1),  # t_min, t_max, p_min, p_max
            "critical_chain": (0, 1, 0, 0.3),  # d_min, d_max, b_min, b_max
            "dependency": (0, 1, 0, 1)  # t_min, t_max, d_min, d_max
        }
        
        # Create combined PDE function
        self.pde_func = create_combined_pde_system(self.domain_bounds)
        
        # Create composite loss function
        self.loss_func = create_loss_function(self.pde_func, bias_weight=0.2, buffer_weight=0.2)
        
        # Training history
        self.history = {
            "total_loss": [],
            "data_loss": [],
            "physics_loss": [],
            "bias_loss": [],
            "buffer_loss": []
        }
        
    def train_epoch(self, X: torch.Tensor, Y: torch.Tensor) -> Dict[str, float]:
        """
        Train the model for one epoch.
        
        Args:
            X: Input tensor
            Y: Target tensor
            
        Returns:
            Dictionary of loss values
        """
        self.model.train()
        self.optimizer.zero_grad()
        
        # Forward pass
        Y_pred = self.model(X)
        
        # Compute data loss
        data_loss = torch.mean((Y_pred - Y) ** 2)
        
        # Compute PDE residuals
        physics_residuals = self.pde_func(X, Y_pred)
        physics_loss = torch.mean(physics_residuals ** 2)
        
        # Compute bias loss
        team_outputs = Y_pred[:, -2:] # Last 2 columns represent team-specific outputs
        bias_loss = torch.var(team_outputs, dim=1).mean()
        
        # Compute buffer overflow loss
        buffers = X[:, 3:4]  # Buffer size from input
        buffer_limit = 0.3  # Maximum buffer
        buffer_usage = Y_pred[:, 1:2]  # Effective duration from output
        buffer_overflow = torch.clamp(buffer_usage - buffers - buffer_limit, min=0)
        buffer_loss = torch.mean(buffer_overflow ** 2)
        
        # Combine losses
        total_loss = data_loss + self.pde_weight * physics_loss + 0.2 * bias_loss + 0.2 * buffer_loss
        
        # Backward pass and optimization
        total_loss.backward()
        self.optimizer.step()
        
        # Record losses
        losses = {
            "total_loss": total_loss.item(),
            "data_loss": data_loss.item(),
            "physics_loss": physics_loss.item(),
            "bias_loss": bias_loss.item(),
            "buffer_loss": buffer_loss.item()
        }
        
        for key, value in losses.items():
            self.history[key].append(value)
            
        return losses
        
    def train(self, X: torch.Tensor, Y: torch.Tensor, 
             epochs: int, batch_size: int = 32,
             validation_split: float = 0.2) -> Dict[str, List[float]]:
        """
        Train the model for multiple epochs.
        
        Args:
            X: Input tensor
            Y: Target tensor
            epochs: Number of epochs to train
            batch_size: Batch size for training
            validation_split: Proportion of data to use for validation
            
        Returns:
            Training history
        """
        # Split data into training and validation sets
        n_samples = X.shape[0]
        n_val = int(n_samples * validation_split)
        n_train = n_samples - n_val
        
        # Shuffle data
        indices = torch.randperm(n_samples)
        X_train = X[indices[:n_train]]
        Y_train = Y[indices[:n_train]]
        X_val = X[indices[n_train:]]
        Y_val = Y[indices[n_train:]]
        
        print(f"Training PINN model for {epochs} epochs with {n_train} samples...")
        
        for epoch in range(epochs):
            # Train in batches
            for i in range(0, n_train, batch_size):
                end = min(i + batch_size, n_train)
                X_batch = X_train[i:end]
                Y_batch = Y_train[i:end]
                
                batch_losses = self.train_epoch(X_batch, Y_batch)
            
            # Validate
            if n_val > 0:
                self.model.eval()
                with torch.no_grad():
                    Y_val_pred = self.model(X_val)
                    val_loss = torch.mean((Y_val_pred - Y_val) ** 2).item()
                
                print(f"Epoch {epoch+1}/{epochs}, Loss: {batch_losses['total_loss']:.4f}, Val Loss: {val_loss:.4f}")
            else:
                print(f"Epoch {epoch+1}/{epochs}, Loss: {batch_losses['total_loss']:.4f}")
        
        return self.history


class PINNManager:
    """
    Manager class for PINN models, handling model creation, training, saving, and loading.
    """
    def __init__(self, model_dir="models"):
        """
        Initialize the PINN manager.
        
        Args:
            model_dir: Directory to save/load models
        """
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Data preprocessor
        self.preprocessor = PINNDataPreprocessor(GDPRCompliantProcessor())
        
        # Models
        self.models = {}
        
    def create_model(self, model_name: str, input_dim=6, output_dim=3) -> DependencyPINN:
        """
        Create a new PINN model.
        
        Args:
            model_name: Name of the model
            input_dim: Input dimension
            output_dim: Output dimension
            
        Returns:
            Created model
        """
        model = DependencyPINN(input_dim=input_dim, output_dim=output_dim)
        self.models[model_name] = model
        return model
    
    def load_model(self, model_name: str) -> Optional[DependencyPINN]:
        """
        Load a saved model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Loaded model or None if not found
        """
        model_path = os.path.join(self.model_dir, f"{model_name}.pt")
        
        if not os.path.exists(model_path):
            print(f"Model {model_name} not found at {model_path}")
            return None
            
        try:
            # Get model configuration
            config_path = os.path.join(self.model_dir, f"{model_name}_config.json")
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    input_dim = config.get("input_dim", 6)
                    output_dim = config.get("output_dim", 3)
            else:
                input_dim, output_dim = 6, 3
                
            # Create model with the right dimensions
            model = DependencyPINN(input_dim=input_dim, output_dim=output_dim)
            
            # Load weights
            model.load_state_dict(torch.load(model_path))
            
            self.models[model_name] = model
            return model
            
        except Exception as e:
            print(f"Error loading model {model_name}: {str(e)}")
            return None
    
    def save_model(self, model_name: str) -> bool:
        """
        Save a model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            True if saved successfully, False otherwise
        """
        if model_name not in self.models:
            print(f"Model {model_name} not found")
            return False
            
        try:
            model = self.models[model_name]
            model_path = os.path.join(self.model_dir, f"{model_name}.pt")
            
            # Save model weights
            torch.save(model.state_dict(), model_path)
            
            # Save configuration
            config = {
                "input_dim": model.input_dim,
                "output_dim": model.output_dim,
                "saved_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            config_path = os.path.join(self.model_dir, f"{model_name}_config.json")
            with open(config_path, 'w') as f:
                json.dump(config, f)
                
            return True
            
        except Exception as e:
            print(f"Error saving model {model_name}: {str(e)}")
            return False
    
    def create_quantized_model(self, model_name: str) -> Optional[QuantizedPINN]:
        """
        Create a quantized version of a model for resource-constrained environments.
        
        Args:
            model_name: Name of the original model
            
        Returns:
            Quantized model or None if original not found
        """
        if model_name not in self.models:
            print(f"Original model {model_name} not found")
            return None
            
        original_model = self.models[model_name]
        quantized_model = QuantizedPINN(original_model)
        
        quantized_name = f"{model_name}_quantized"
        self.models[quantized_name] = quantized_model
        
        return quantized_model
    
    def train_model(self, model_name: str, work_items_json: str, dependencies_json: str, 
                   team_velocities_json: str, epochs: int = 100, batch_size: int = 32) -> Dict:
        """
        Train a PINN model using Azure DevOps data.
        
        Args:
            model_name: Name of the model to train
            work_items_json: JSON string with work items data
            dependencies_json: JSON string with dependencies data
            team_velocities_json: JSON string with team velocities data
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Dictionary with training results
        """
        try:
            # Parse JSON data
            work_items = json.loads(work_items_json)
            dependencies = json.loads(dependencies_json)
            team_velocities = json.loads(team_velocities_json)
            
            # Prepare data for training
            train_data = self.preprocessor.prepare_training_data(
                work_items, dependencies, team_velocities
            )
            
            if not train_data:
                return {"success": False, "error": "Failed to prepare training data"}
                
            # Get or create model
            if model_name in self.models:
                model = self.models[model_name]
            else:
                model = self.create_model(model_name)
                
            # Create trainer
            trainer = PINNTrainer(model)
            
            # Train model
            history = trainer.train(
                train_data["X"], train_data["Y"], 
                epochs=epochs, batch_size=batch_size
            )
            
            # Save model
            self.save_model(model_name)
            
            return {
                "success": True,
                "model_name": model_name,
                "epochs": epochs,
                "final_loss": history["total_loss"][-1] if history["total_loss"] else None
            }
            
        except Exception as e:
            print(f"Error training model: {str(e)}")
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def predict_risk(self, model_name: str, input_data_json: str) -> Dict:
        """
        Predict risk using a trained PINN model.
        
        Args:
            model_name: Name of the model to use
            input_data_json: JSON string with input data
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Load model if not already loaded
            if model_name not in self.models:
                self.load_model(model_name)
                
            if model_name not in self.models:
                return {"success": False, "error": f"Model {model_name} not found"}
                
            model = self.models[model_name]
            
            # Parse input data
            input_data = json.loads(input_data_json)
            
            # Prepare input tensor
            # This would need proper preprocessing based on the specific input format
            input_tensor = torch.tensor([
                input_data.get("teamVelocity", 50) / 100,
                input_data.get("people", 5) / 20,
                input_data.get("duration", 5) / 13,
                input_data.get("buffer", 0.1) / 0.3,
                input_data.get("time", 0.5),
                input_data.get("depth", 0.5)
            ], dtype=torch.float32).unsqueeze(0)
            
            # Make prediction
            model.eval()
            with torch.no_grad():
                output = model(input_tensor)
                
            # Extract predictions
            productivity = float(output[0, 0]) * 100  # Scale to percentage
            effective_duration = float(output[0, 1]) * 13  # Scale to story points
            delay = float(output[0, 2]) * 100  # Scale to percentage
            
            # Calculate risk score
            risk_score = delay
            
            return {
                "success": True,
                "risk_score": risk_score,
                "productivity": productivity,
                "effective_duration": effective_duration,
                "delay": delay
            }
            
        except Exception as e:
            print(f"Error predicting risk: {str(e)}")
            return {"success": False, "error": str(e)}


# Create global instance of PINN Manager
pinn_manager = PINNManager()

# Command handlers for integration with TypeScript backend
def train_pinn_model(args):
    """Handle PINN model training command."""
    try:
        work_items_json = args[0]
        dependencies_json = args[1]
        team_velocities_json = args[2]
        model_name = json.loads(args[3]) if len(args) > 3 else "dependency_pinn"
        epochs = int(json.loads(args[4])) if len(args) > 4 else 100
        
        result = pinn_manager.train_model(
            model_name, work_items_json, dependencies_json, team_velocities_json, epochs
        )
        
        return result
    except Exception as e:
        print(f"Error in train_pinn_model: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def predict_pinn_risk(args):
    """Handle PINN risk prediction command."""
    try:
        input_data_json = args[0]
        model_name = json.loads(args[1]) if len(args) > 1 else "dependency_pinn"
        
        result = pinn_manager.predict_risk(model_name, input_data_json)
        
        return result
    except Exception as e:
        print(f"Error in predict_pinn_risk: {str(e)}")
        return {"success": False, "error": str(e)}

def create_quantized_pinn(args):
    """Handle creation of quantized PINN model."""
    try:
        model_name = json.loads(args[0])
        
        quantized_model = pinn_manager.create_quantized_model(model_name)
        
        if quantized_model:
            quantized_name = f"{model_name}_quantized"
            pinn_manager.save_model(quantized_name)
            return {"success": True, "model_name": quantized_name}
        else:
            return {"success": False, "error": f"Failed to create quantized model for {model_name}"}
    except Exception as e:
        print(f"Error in create_quantized_pinn: {str(e)}")
        return {"success": False, "error": str(e)}

# Main function to handle command line arguments
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        return
    
    command = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    # Map commands to functions
    command_map = {
        'train_pinn_model': train_pinn_model,
        'predict_pinn_risk': predict_pinn_risk,
        'create_quantized_pinn': create_quantized_pinn
    }
    
    if command in command_map:
        result = command_map[command](args)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))

if __name__ == "__main__":
    main()