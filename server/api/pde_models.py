#!/usr/bin/env python3
import numpy as np
import deepxde as dde
import torch

"""
This module defines the partial differential equations (PDEs) that model software development
physics based on established project management theories like Brooks' Law and Critical Chain Theory.

These PDEs will be incorporated into Physics-Informed Neural Networks (PINNs) to predict
dependencies, risks, and delays in software development projects.
"""

class BrooksLawPDE:
    """
    Brooks' Law states: "Adding manpower to a late software project makes it later."
    
    This is modeled as a nonlinear PDE where communication overhead increases 
    quadratically with the number of people, while productivity increases linearly.
    """
    def __init__(self, domain_bounds, comm_factor=0.1):
        """
        Initialize the Brooks' Law PDE model.
        
        Args:
            domain_bounds: Tuple of (t_min, t_max, p_min, p_max) defining the domain
                           t represents time and p represents people/resources
            comm_factor: Communication overhead factor (default: 0.1)
        """
        self.domain_bounds = domain_bounds
        self.comm_factor = comm_factor
        self.create_domain()
        
    def create_domain(self):
        """Create the computational domain for the PDE."""
        t_min, t_max, p_min, p_max = self.domain_bounds
        self.geom = dde.geometry.Rectangle([t_min, p_min], [t_max, p_max])
        self.timedomain = dde.geometry.TimeDomain(t_min, t_max)
        self.geomtime = dde.geometry.GeometryXTime(self.geom, self.timedomain)
        
    def pde(self, x, y):
        """
        Brooks' Law PDE: Productivity is a function of time and people.
        
        dP/dt + C * p^2 * dP/dp = p * (1 - P)
        
        where:
        - P is productivity
        - t is time
        - p is people
        - C is communication overhead factor
        
        Args:
            x: Input coordinates (t, p)
            y: Network output (P - productivity)
            
        Returns:
            The residual of the PDE
        """
        # Extract variables
        P = y
        
        # Get gradients
        P_t = dde.grad.jacobian(y, x, i=0, j=0)
        P_p = dde.grad.jacobian(y, x, i=0, j=1)
        
        # Extract time and people variables
        t, p = x[:, 0:1], x[:, 1:2]
        
        # Brooks' Law PDE
        # dP/dt + C * p^2 * dP/dp = p * (1 - P)
        return P_t + self.comm_factor * p**2 * P_p - p * (1 - P)
    
    def set_boundary_conditions(self, func=None):
        """
        Set boundary conditions for the PDE.
        
        Args:
            func: Function defining initial/boundary conditions (optional)
        
        Returns:
            List of boundary conditions
        """
        # Default initial conditions: At t=0, productivity is proportional to people
        if func is None:
            def initial_condition(x):
                t, p = x[:, 0:1], x[:, 1:2]
                return p / (1 + 0.1 * p)  # Initial productivity formula
        else:
            initial_condition = func
            
        # Set t=0 as initial condition
        t_min, _, _, _ = self.domain_bounds
        ic = dde.icbc.IC(self.geomtime, initial_condition, lambda _, on_boundary: on_boundary and np.isclose(_, t_min))
        
        return [ic]


class CriticalChainPDE:
    """
    Critical Chain Theory models how buffers and dependencies affect project timelines.
    
    This is modeled as a PDE where task duration is influenced by buffers, resources,
    and dependencies between tasks.
    """
    def __init__(self, domain_bounds, buffer_limit=0.3):
        """
        Initialize the Critical Chain PDE model.
        
        Args:
            domain_bounds: Tuple of (d_min, d_max, b_min, b_max) defining the domain
                          d represents task duration and b represents buffer size
            buffer_limit: Maximum effective buffer ratio (default: 0.3)
        """
        self.domain_bounds = domain_bounds
        self.buffer_limit = buffer_limit
        self.create_domain()
        
    def create_domain(self):
        """Create the computational domain for the PDE."""
        d_min, d_max, b_min, b_max = self.domain_bounds
        self.geom = dde.geometry.Rectangle([d_min, b_min], [d_max, b_max])
        
    def pde(self, x, y):
        """
        Critical Chain PDE: Effective task duration is a function of nominal duration,
        buffer size, and dependency constraints.
        
        dE/dd + dE/db = alpha * (1 - b/b_limit)
        
        where:
        - E is effective task duration
        - d is nominal task duration
        - b is buffer size
        - alpha is a scaling factor
        - b_limit is buffer limit
        
        Args:
            x: Input coordinates (d, b)
            y: Network output (E - effective duration)
            
        Returns:
            The residual of the PDE
        """
        # Extract variables
        E = y
        
        # Get gradients
        E_d = dde.grad.jacobian(y, x, i=0, j=0)
        E_b = dde.grad.jacobian(y, x, i=0, j=1)
        
        # Extract duration and buffer variables
        d, b = x[:, 0:1], x[:, 1:2]
        
        # Alpha is a scaling factor (varies with domain)
        alpha = 0.5
        
        # Critical Chain PDE
        # dE/dd + dE/db = alpha * (1 - b/b_limit)
        return E_d + E_b - alpha * (1 - torch.clamp(b / self.buffer_limit, 0, 1))
    
    def set_boundary_conditions(self):
        """
        Set boundary conditions for the PDE.
        
        Returns:
            List of boundary conditions
        """
        d_min, _, b_min, _ = self.domain_bounds
        
        # Boundary condition: At minimum duration and buffer, effective duration equals nominal
        def bc_func(x):
            d = x[:, 0:1]
            return d  # Effective duration equals nominal duration
        
        # Set boundary condition
        bc = dde.icbc.DirichletBC(self.geom, bc_func, lambda x, on_boundary: on_boundary and np.isclose(x[1], b_min))
        
        return [bc]


class DependencyPropagationPDE:
    """
    This PDE models how delays propagate through dependent tasks in a project.
    """
    def __init__(self, domain_bounds, propagation_factor=0.8):
        """
        Initialize the Dependency Propagation PDE model.
        
        Args:
            domain_bounds: Tuple of (t_min, t_max, d_min, d_max) defining the domain
                          t represents time and d represents dependency depth
            propagation_factor: How much of a delay propagates to dependencies (default: 0.8)
        """
        self.domain_bounds = domain_bounds
        self.propagation_factor = propagation_factor
        self.create_domain()
        
    def create_domain(self):
        """Create the computational domain for the PDE."""
        t_min, t_max, d_min, d_max = self.domain_bounds
        self.geom = dde.geometry.Rectangle([t_min, d_min], [t_max, d_max])
        
    def pde(self, x, y):
        """
        Dependency Propagation PDE: Delay at each dependency level is a function of 
        time and the propagation from previous dependencies.
        
        dD/dt + v * dD/dd = -gamma * D
        
        where:
        - D is delay
        - t is time
        - d is dependency depth
        - v is propagation velocity
        - gamma is decay factor
        
        Args:
            x: Input coordinates (t, d)
            y: Network output (D - delay)
            
        Returns:
            The residual of the PDE
        """
        # Extract variables
        D = y
        
        # Get gradients
        D_t = dde.grad.jacobian(y, x, i=0, j=0)
        D_d = dde.grad.jacobian(y, x, i=0, j=1)
        
        # Extract time and dependency depth variables
        t, d = x[:, 0:1], x[:, 1:2]
        
        # Propagation velocity (depends on project complexity)
        v = self.propagation_factor
        
        # Decay factor (delays naturally diminish over time)
        gamma = 0.2
        
        # Dependency Propagation PDE
        # dD/dt + v * dD/dd = -gamma * D
        return D_t + v * D_d + gamma * D
    
    def set_boundary_conditions(self, initial_delay_func=None):
        """
        Set boundary conditions for the PDE.
        
        Args:
            initial_delay_func: Function defining initial delay distribution (optional)
        
        Returns:
            List of boundary conditions
        """
        t_min, _, d_min, _ = self.domain_bounds
        
        # Default initial condition: At t=0, delay at d=0 is highest and decays with depth
        if initial_delay_func is None:
            def initial_condition(x):
                t, d = x[:, 0:1], x[:, 1:2]
                return np.exp(-d)  # Exponential decay of initial delay with depth
        else:
            initial_condition = initial_delay_func
            
        # Set initial conditions at t=0
        ic = dde.icbc.IC(self.geom, initial_condition, lambda x, on_boundary: on_boundary and np.isclose(x[0], t_min))
        
        # Set boundary condition at d=0 (source of delay)
        def bc_func(x):
            t = x[:, 0:1]
            return np.exp(-0.5 * t)  # Delay at source decays with time
            
        bc = dde.icbc.DirichletBC(self.geom, bc_func, lambda x, on_boundary: on_boundary and np.isclose(x[1], d_min))
        
        return [ic, bc]


# Utility functions for creating combined PDEs

def create_combined_pde_system(domain_bounds, weights=None):
    """
    Create a combined PDE system that incorporates multiple project physics models.
    
    Args:
        domain_bounds: Dictionary of domain bounds for each PDE
        weights: Dictionary of weights for each PDE's contribution
        
    Returns:
        Combined PDE function and boundary conditions
    """
    # Initialize default weights if none provided
    if weights is None:
        weights = {
            "brooks": 0.4,
            "critical_chain": 0.4,
            "dependency": 0.2
        }
    
    # Create individual PDE instances
    brooks_pde = BrooksLawPDE(domain_bounds["brooks"])
    critical_chain_pde = CriticalChainPDE(domain_bounds["critical_chain"])
    dependency_pde = DependencyPropagationPDE(domain_bounds["dependency"])
    
    # Combined PDE function
    def combined_pde(x, y):
        """
        Combined PDE incorporating all project physics models.
        
        Args:
            x: Input coordinates
            y: Network output
            
        Returns:
            Weighted sum of PDE residuals
        """
        # Split the input coordinates for each model
        x_brooks = x[:, :2]  # time, people
        x_critical = x[:, 2:4]  # duration, buffer
        x_dependency = x[:, 4:6]  # time, depth
        
        # Split the output for each model
        y_brooks = y[:, 0:1]  # productivity
        y_critical = y[:, 1:2]  # effective duration
        y_dependency = y[:, 2:3]  # delay
        
        # Calculate residuals for each PDE
        r_brooks = brooks_pde.pde(x_brooks, y_brooks)
        r_critical = critical_chain_pde.pde(x_critical, y_critical)
        r_dependency = dependency_pde.pde(x_dependency, y_dependency)
        
        # Combine residuals with weights
        return (weights["brooks"] * r_brooks + 
                weights["critical_chain"] * r_critical + 
                weights["dependency"] * r_dependency)
    
    return combined_pde

def create_loss_function(pde_func, bias_weight=0.2, buffer_weight=0.2):
    """
    Create a composite loss function incorporating PDE residuals, bias minimization,
    and buffer overflow penalties.
    
    Args:
        pde_func: The PDE function to compute residuals
        bias_weight: Weight for the bias loss term
        buffer_weight: Weight for the buffer overflow loss term
        
    Returns:
        Loss function for training the PINN
    """
    def composite_loss(model, x, y_true):
        """
        Composite loss function.
        
        Args:
            model: The PINN model
            x: Input coordinates
            y_true: Ground truth values
            
        Returns:
            Total loss combining data, physics, bias, and buffer terms
        """
        # Predict outputs
        y_pred = model(x)
        
        # Data loss (MSE between predictions and ground truth)
        data_loss = torch.mean((y_pred - y_true) ** 2)
        
        # Physics loss (PDE residuals)
        physics_residuals = pde_func(x, y_pred)
        physics_loss = torch.mean(physics_residuals ** 2)
        
        # Bias loss (ensure similar treatment for different teams)
        # Extract team-specific outputs and compare
        team_outputs = y_pred[:, -2:] # Assuming last 2 outputs correspond to teams
        bias_loss = torch.var(team_outputs, dim=1).mean()
        
        # Buffer overflow loss (penalize exceeding buffer limits)
        buffers = x[:, 3:4]  # Buffer size from input
        buffer_limit = 0.3
        buffer_usage = y_pred[:, 1:2]  # Effective duration from output
        buffer_overflow = torch.clamp(buffer_usage - buffers - buffer_limit, min=0)
        buffer_loss = torch.mean(buffer_overflow ** 2)
        
        # Combine all loss terms
        total_loss = data_loss + physics_loss + bias_weight * bias_loss + buffer_weight * buffer_loss
        
        return total_loss
    
    return composite_loss