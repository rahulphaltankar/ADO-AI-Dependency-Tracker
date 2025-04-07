#!/usr/bin/env python3
import numpy as np
import hashlib
import json
import torch
import re
from typing import Dict, List, Tuple, Any, Optional, Union

"""
This module handles the preparation, anonymization, and preprocessing of data
for training Physics-Informed Neural Networks (PINNs) in the ADO AI Dependency Tracker.

It includes GDPR compliance features such as data anonymization and provides
utilities for converting Azure DevOps work items and dependencies into formats
suitable for PINN training.
"""

class GDPRCompliantProcessor:
    """
    Handles GDPR-compliant data processing including anonymization and opt-out management.
    """
    def __init__(self, anonymize_fields=None, salt=None):
        """
        Initialize the GDPR-compliant processor.
        
        Args:
            anonymize_fields: List of field names to anonymize
            salt: Salt value for hashing (if None, a random salt is generated)
        """
        self.anonymize_fields = anonymize_fields or [
            "title", "description", "assignedTo", "createdBy"
        ]
        self.salt = salt or self._generate_salt()
        self.opt_out_users = set()
        
    def _generate_salt(self) -> str:
        """Generate a random salt for hashing."""
        return hashlib.sha256(str(np.random.rand()).encode()).hexdigest()[:16]
    
    def anonymize_value(self, value: str) -> str:
        """
        Anonymize a value using SHA-3 hashing.
        
        Args:
            value: Value to anonymize
            
        Returns:
            Anonymized hash value
        """
        if not value:
            return ""
            
        # Use SHA-3 (SHA-256) for hashing
        salted_value = f"{value}{self.salt}"
        return hashlib.sha3_256(salted_value.encode()).hexdigest()
    
    def anonymize_work_item(self, work_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Anonymize sensitive fields in a work item.
        
        Args:
            work_item: Work item data dictionary
            
        Returns:
            Anonymized work item
        """
        anonymized_item = work_item.copy()
        
        for field in self.anonymize_fields:
            if field in anonymized_item and anonymized_item[field]:
                anonymized_item[field] = self.anonymize_value(str(anonymized_item[field]))
                
        return anonymized_item
    
    def register_opt_out(self, user_id: str) -> None:
        """
        Register a user who has opted out of data processing.
        
        Args:
            user_id: User ID to exclude from processing
        """
        self.opt_out_users.add(user_id)
    
    def remove_opt_out_data(self, work_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove data for users who have opted out.
        
        Args:
            work_items: List of work item dictionaries
            
        Returns:
            Filtered list without opt-out users' data
        """
        return [
            item for item in work_items 
            if "assignedTo" not in item or item["assignedTo"] not in self.opt_out_users
        ]
    
    def process_dataset(self, work_items: List[Dict[str, Any]], 
                       dependencies: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Process a complete dataset, applying anonymization and opt-out filtering.
        
        Args:
            work_items: List of work item dictionaries
            dependencies: List of dependency dictionaries
            
        Returns:
            Tuple of (processed_work_items, processed_dependencies)
        """
        # Remove opted-out users
        filtered_work_items = self.remove_opt_out_data(work_items)
        
        # Anonymize remaining items
        anonymized_work_items = [self.anonymize_work_item(item) for item in filtered_work_items]
        
        # Filter dependencies to only include remaining work items
        valid_ids = {item["id"] for item in anonymized_work_items}
        filtered_dependencies = [
            dep for dep in dependencies
            if dep["sourceId"] in valid_ids and dep["targetId"] in valid_ids
        ]
        
        return anonymized_work_items, filtered_dependencies


class PINNDataPreprocessor:
    """
    Prepares data for PINN training, including feature extraction and normalization.
    """
    def __init__(self, gdpr_processor: Optional[GDPRCompliantProcessor] = None):
        """
        Initialize the PINN data preprocessor.
        
        Args:
            gdpr_processor: Optional GDPR-compliant processor for anonymization
        """
        self.gdpr_processor = gdpr_processor or GDPRCompliantProcessor()
        self.feature_ranges = {}
        
    def extract_brooks_law_features(self, work_items: List[Dict[str, Any]], 
                                   team_velocities: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract features relevant to Brooks' Law PDE.
        
        Args:
            work_items: List of work item dictionaries
            team_velocities: Team velocity data
            
        Returns:
            Array of [time, people, productivity] features
        """
        features = []
        
        for item in work_items:
            # Time feature (normalized to sprint)
            sprint_match = re.search(r'Sprint (\d+)', item.get("sprint", "Sprint 0"))
            sprint_num = int(sprint_match.group(1)) if sprint_match else 0
            time_feature = sprint_num / 20  # Normalize to [0,1] assuming max 20 sprints
            
            # People feature (team size or assigned resources)
            team = item.get("team", "")
            team_data = next((t for t in team_velocities if t["team"] == team), None)
            team_size = len(set(wi.get("assignedTo", "") for wi in work_items if wi.get("team", "") == team))
            people_feature = team_size / 20  # Normalize to [0,1] assuming max 20 people
            
            # Productivity feature (completed story points per sprint)
            if team_data and team_data.get("sprints"):
                last_sprint = team_data["sprints"][-1]
                productivity = last_sprint.get("completed", 0) / max(last_sprint.get("planned", 1), 1)
            else:
                productivity = 0.5  # Default
                
            features.append([time_feature, people_feature, productivity])
            
        return np.array(features)
    
    def extract_critical_chain_features(self, work_items: List[Dict[str, Any]], 
                                       dependencies: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract features relevant to Critical Chain PDE.
        
        Args:
            work_items: List of work item dictionaries
            dependencies: List of dependency dictionaries
            
        Returns:
            Array of [duration, buffer, effective_duration] features
        """
        features = []
        
        # Create a map for quick lookup
        work_item_map = {item["id"]: item for item in work_items}
        
        for item in work_items:
            # Nominal duration (from story points)
            story_points = item.get("storyPoints", 3)
            nominal_duration = story_points / 13  # Normalize to [0,1] assuming max 13 points
            
            # Buffer (calculated from slack in schedule)
            dependencies_for_item = [d for d in dependencies if d["targetId"] == item["id"]]
            if dependencies_for_item:
                # Calculate slack based on dependencies
                max_dependency_risk = max((d.get("riskScore", 0) / 100) for d in dependencies_for_item)
                buffer = 0.3 * (1 - max_dependency_risk)  # Higher risk = lower buffer
            else:
                buffer = 0.3  # Default buffer
                
            # Effective duration (actual time taken including delays)
            delay_factor = item.get("riskScore", 50) / 100  # Normalize to [0,1]
            effective_duration = nominal_duration * (1 + delay_factor)
            
            features.append([nominal_duration, buffer, effective_duration])
            
        return np.array(features)
    
    def extract_dependency_propagation_features(self, 
                                              work_items: List[Dict[str, Any]], 
                                              dependencies: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract features relevant to Dependency Propagation PDE.
        
        Args:
            work_items: List of work item dictionaries
            dependencies: List of dependency dictionaries
            
        Returns:
            Array of [time, dependency_depth, delay] features
        """
        features = []
        
        # Build dependency graph
        dependency_graph = {}
        for dep in dependencies:
            if dep["sourceId"] not in dependency_graph:
                dependency_graph[dep["sourceId"]] = []
            dependency_graph[dep["sourceId"]].append(dep["targetId"])
            
        # Calculate dependency depth for each item
        depths = {}
        
        def calc_depth(item_id, visited=None):
            if visited is None:
                visited = set()
                
            if item_id in visited:
                return 0  # Avoid cycles
                
            visited.add(item_id)
                
            if item_id not in dependency_graph:
                return 0
                
            max_depth = 0
            for dep_id in dependency_graph[item_id]:
                depth = calc_depth(dep_id, visited.copy()) + 1
                max_depth = max(max_depth, depth)
                
            return max_depth
            
        for item in work_items:
            depths[item["id"]] = calc_depth(item["id"])
            
        # Create features
        for item in work_items:
            # Time feature (normalized to sprint)
            sprint_match = re.search(r'Sprint (\d+)', item.get("sprint", "Sprint 0"))
            sprint_num = int(sprint_match.group(1)) if sprint_match else 0
            time_feature = sprint_num / 20  # Normalize to [0,1] assuming max 20 sprints
            
            # Dependency depth (how deep in the dependency chain)
            depth = depths[item["id"]] / 10  # Normalize to [0,1] assuming max depth of 10
            
            # Delay (from risk score)
            delay = item.get("riskScore", 50) / 100  # Normalize to [0,1]
            
            features.append([time_feature, depth, delay])
            
        return np.array(features)
    
    def normalize_features(self, features: np.ndarray, feature_name: str) -> np.ndarray:
        """
        Normalize features to [0,1] range and store normalization parameters.
        
        Args:
            features: Feature array to normalize
            feature_name: Name to identify this feature set
            
        Returns:
            Normalized features
        """
        # Store min/max for each feature dimension
        feature_mins = features.min(axis=0)
        feature_maxs = features.max(axis=0)
        
        # Avoid division by zero
        ranges = feature_maxs - feature_mins
        ranges[ranges == 0] = 1
        
        # Store for later use
        self.feature_ranges[feature_name] = {
            "mins": feature_mins,
            "maxs": feature_maxs
        }
        
        # Normalize
        normalized_features = (features - feature_mins) / ranges
        
        return normalized_features
    
    def denormalize_features(self, normalized_features: np.ndarray, feature_name: str) -> np.ndarray:
        """
        Denormalize features from [0,1] range back to original scale.
        
        Args:
            normalized_features: Normalized feature array
            feature_name: Name identifying this feature set
            
        Returns:
            Denormalized features
        """
        if feature_name not in self.feature_ranges:
            raise ValueError(f"No normalization parameters found for {feature_name}")
            
        feature_mins = self.feature_ranges[feature_name]["mins"]
        feature_maxs = self.feature_ranges[feature_name]["maxs"]
        ranges = feature_maxs - feature_mins
        
        # Denormalize
        denormalized_features = normalized_features * ranges + feature_mins
        
        return denormalized_features
    
    def prepare_training_data(self, 
                            work_items: List[Dict[str, Any]], 
                            dependencies: List[Dict[str, Any]],
                            team_velocities: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        """
        Prepare complete training dataset for PINN model.
        
        Args:
            work_items: List of work item dictionaries
            dependencies: List of dependency dictionaries
            team_velocities: Team velocity data
            
        Returns:
            Dictionary of PyTorch tensors for training
        """
        # Apply GDPR compliance processing
        processed_work_items, processed_dependencies = \
            self.gdpr_processor.process_dataset(work_items, dependencies)
        
        # Extract features for each PDE
        brooks_features = self.extract_brooks_law_features(processed_work_items, team_velocities)
        critical_chain_features = self.extract_critical_chain_features(processed_work_items, processed_dependencies)
        dependency_features = self.extract_dependency_propagation_features(processed_work_items, processed_dependencies)
        
        # Normalize features
        brooks_features_norm = self.normalize_features(brooks_features, "brooks")
        critical_chain_features_norm = self.normalize_features(critical_chain_features, "critical_chain")
        dependency_features_norm = self.normalize_features(dependency_features, "dependency")
        
        # Combine features for training
        X_brooks = brooks_features_norm[:, :2]  # time, people
        Y_brooks = brooks_features_norm[:, 2:3]  # productivity
        
        X_critical = critical_chain_features_norm[:, :2]  # duration, buffer
        Y_critical = critical_chain_features_norm[:, 2:3]  # effective_duration
        
        X_dependency = dependency_features_norm[:, :2]  # time, depth
        Y_dependency = dependency_features_norm[:, 2:3]  # delay
        
        # Combined inputs and outputs for unified model
        X_combined = np.concatenate([
            X_brooks, X_critical, X_dependency
        ], axis=1)
        
        Y_combined = np.concatenate([
            Y_brooks, Y_critical, Y_dependency
        ], axis=1)
        
        # Create PyTorch tensors
        X_tensor = torch.tensor(X_combined, dtype=torch.float32)
        Y_tensor = torch.tensor(Y_combined, dtype=torch.float32)
        
        return {
            "X": X_tensor,
            "Y": Y_tensor,
            "X_brooks": torch.tensor(X_brooks, dtype=torch.float32),
            "Y_brooks": torch.tensor(Y_brooks, dtype=torch.float32),
            "X_critical": torch.tensor(X_critical, dtype=torch.float32),
            "Y_critical": torch.tensor(Y_critical, dtype=torch.float32),
            "X_dependency": torch.tensor(X_dependency, dtype=torch.float32),
            "Y_dependency": torch.tensor(Y_dependency, dtype=torch.float32)
        }


# Utility functions

def preprocess_ado_data(work_items_json, dependencies_json, team_velocities_json):
    """
    Preprocess ADO data from JSON format for PINN training.
    
    Args:
        work_items_json: JSON string with work items data
        dependencies_json: JSON string with dependencies data
        team_velocities_json: JSON string with team velocities data
        
    Returns:
        Preprocessed data dictionary for PINN training
    """
    try:
        # Parse JSON data
        work_items = json.loads(work_items_json)
        dependencies = json.loads(dependencies_json)
        team_velocities = json.loads(team_velocities_json)
        
        # Create preprocessor and prepare data
        gdpr_processor = GDPRCompliantProcessor()
        preprocessor = PINNDataPreprocessor(gdpr_processor)
        
        return preprocessor.prepare_training_data(work_items, dependencies, team_velocities)
        
    except Exception as e:
        print(f"Error preprocessing ADO data: {str(e)}")
        return None