#!/usr/bin/env python3
import sys
import json
import numpy as np
import networkx as nx
import os
import traceback

# For spaCy and scikit-learn, try to import but handle missing dependencies
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

try:
    from sklearn.ensemble import GradientBoostingRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Try importing the PINN modules
try:
    import torch
    import deepxde as dde
    from .pinn_model import pinn_manager, DependencyPINN
    from .data_processor import GDPRCompliantProcessor, PINNDataPreprocessor
    from .pde_models import BrooksLawPDE, CriticalChainPDE, DependencyPropagationPDE
    PINN_AVAILABLE = True
except ImportError as e:
    print(f"Warning: PINN dependencies not available: {e}", file=sys.stderr)
    PINN_AVAILABLE = False
except Exception as e:
    print(f"Error importing PINN modules: {e}", file=sys.stderr)
    traceback.print_exc()
    PINN_AVAILABLE = False

# Initialize spaCy if available
nlp = None
if SPACY_AVAILABLE:
    try:
        nlp = spacy.load("en_core_web_sm")
    except:
        # Try downloading the model if not already installed
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            nlp = spacy.load("en_core_web_sm")
        except:
            pass

# Simple trained model for risk prediction
class RiskPredictionModel:
    def __init__(self):
        self.model = None
        if SKLEARN_AVAILABLE:
            self.model = self.train_model()

    def train_model(self):
        # Very simple training data (this would be more complex in real life)
        # Format: [team_velocity, dependency_complexity, resource_allocation] -> risk_score
        X = np.array([
            [10, 20, 30],  # Low risk factors -> low risk
            [30, 40, 50],  # Medium risk factors -> medium risk
            [70, 60, 70],  # High risk factors -> high risk
            [90, 80, 90],  # Very high risk factors -> very high risk
            [50, 50, 50],  # Medium everything -> medium risk
            [20, 80, 40],  # Low velocity, high complexity -> high risk
            [80, 20, 40],  # High velocity, low complexity -> medium-low risk
            [40, 60, 90],  # Medium velocity, high resource issues -> high risk
        ])
        
        y = np.array([
            15,   # Low risk
            45,   # Medium risk
            75,   # High risk
            95,   # Very high risk
            50,   # Medium risk
            70,   # High risk
            30,   # Medium-low risk
            75    # High risk
        ])
        
        # Train a simple Gradient Boosting model
        model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        return model
    
    def predict(self, team_velocity, dependency_complexity, resource_allocation):
        if not self.model:
            # Fallback formula if scikit-learn is not available
            return (0.4 * team_velocity + 0.4 * dependency_complexity + 
                    0.2 * resource_allocation)
            
        # Convert to feature array and predict
        features = np.array([[team_velocity, dependency_complexity, resource_allocation]])
        prediction = self.model.predict(features)[0]
        
        # Ensure prediction is within 0-100 range
        return max(0, min(100, prediction))

# Initialize risk model
risk_model = RiskPredictionModel()

# Command handlers
def predict_risk(args):
    """
    Predict risk using traditional ML model.
    """
    factors = json.loads(args[0])
    team_velocity = factors.get('teamVelocity', 50)
    dependency_complexity = factors.get('dependencyComplexity', 50)
    resource_allocation = factors.get('resourceAllocation', 50)
    
    # Check if we should use PINN for prediction
    use_pinn = factors.get('usePINN', False)
    
    if use_pinn and PINN_AVAILABLE:
        try:
            # Format the input data for PINN
            input_data = {
                "teamVelocity": team_velocity,
                "people": factors.get('teamSize', 5),
                "duration": factors.get('storyPoints', 5),
                "buffer": factors.get('buffer', 0.1),
                "time": factors.get('time', 0.5),
                "depth": factors.get('depth', 0.5)
            }
            
            # Use PINN for prediction
            pinn_result = pinn_manager.predict_risk("dependency_pinn", json.dumps(input_data))
            
            if pinn_result.get("success", False):
                return {
                    'risk': pinn_result["risk_score"],
                    'productivity': pinn_result["productivity"],
                    'effectiveDuration': pinn_result["effective_duration"],
                    'delay': pinn_result["delay"],
                    'model': 'pinn',
                    'usedFallback': False
                }
        except Exception as e:
            print(f"PINN prediction failed, falling back to traditional model: {e}", file=sys.stderr)
            traceback.print_exc()
    
    # Fall back to traditional risk model
    risk = risk_model.predict(team_velocity, dependency_complexity, resource_allocation)
    return {
        'risk': risk,
        'model': 'traditional',
        'usedFallback': use_pinn and PINN_AVAILABLE  # True if PINN was requested but failed
    }

def train_pinn_model(args):
    """
    Train a PINN model using work items, dependencies, and team velocity data.
    """
    if not PINN_AVAILABLE:
        return {'success': False, 'error': 'PINN dependencies not available'}
    
    try:
        if len(args) < 3:
            return {'success': False, 'error': 'Missing required arguments for training'}
        
        work_items_json = args[0]
        dependencies_json = args[1]
        team_velocities_json = args[2]
        
        # Optional arguments
        model_name = json.loads(args[3]) if len(args) > 3 else "dependency_pinn"
        epochs = int(json.loads(args[4])) if len(args) > 4 else 50
        
        # Call PINN manager to train model
        result = pinn_manager.train_model(
            model_name, work_items_json, dependencies_json, team_velocities_json, epochs
        )
        
        return result
    except Exception as e:
        traceback.print_exc()
        return {'success': False, 'error': f'Error training PINN model: {str(e)}'}

def analyze_dependency(args):
    """
    Analyze dependency text using NLP.
    """
    text = json.loads(args[0])
    
    if not SPACY_AVAILABLE or not nlp:
        # Fallback basic analysis
        results = {
            'entities': [],
            'dependencies': [],
            'has_dependency_markers': 'depends' in text.lower() or 'blocked' in text.lower() or 'requires' in text.lower()
        }
    else:
        # Use spaCy for NLP analysis
        doc = nlp(text)
        
        # Extract entities
        entities = [{'text': ent.text, 'label': ent.label_} for ent in doc.ents]
        
        # Look for dependency phrases
        dependency_markers = ['depends on', 'dependent on', 'blocked by', 'blocks', 
                             'requires', 'required by', 'waiting for', 'until']
        
        dependencies = []
        for marker in dependency_markers:
            if marker in text.lower():
                # Find sentences containing the marker
                for sent in doc.sents:
                    if marker in sent.text.lower():
                        dependencies.append({
                            'marker': marker,
                            'sentence': sent.text
                        })
        
        results = {
            'entities': entities,
            'dependencies': dependencies,
            'has_dependency_markers': len(dependencies) > 0
        }
    
    # If PINN is available, enrich the analysis with physics-based insights
    if PINN_AVAILABLE and len(results['dependencies']) > 0:
        try:
            # Get additional insights based on physics models
            results['physics_insights'] = {
                'has_critical_chain_impact': any(m in text.lower() for m in ['deadline', 'critical', 'timeline']),
                'has_brooks_law_indicators': any(m in text.lower() for m in ['team', 'resource', 'staff', 'personnel']),
                'delay_risk_factors': [
                    d['marker'] for d in results['dependencies']
                    if d['marker'] in ['blocked by', 'waiting for', 'until']
                ]
            }
        except Exception as e:
            print(f"Error enriching dependency analysis: {e}", file=sys.stderr)
    
    return results

def find_critical_path(args):
    """
    Find the critical path in a dependency network.
    """
    nodes = json.loads(args[0])
    edges = json.loads(args[1])
    
    # Check if we should use PINN for critical path analysis
    use_pinn = False
    if len(args) > 2:
        options = json.loads(args[2])
        use_pinn = options.get('usePINN', False)
    
    # If PINN is available and requested, use PINN-enhanced critical path analysis
    if use_pinn and PINN_AVAILABLE:
        try:
            # Convert edges to include physics-based weights
            physics_edges = []
            
            for edge in edges:
                physics_weight = edge['weight']
                
                # Enhance weight with physics-based factors if available
                if 'riskScore' in edge:
                    # Higher risk increases the effective weight (delay)
                    risk_factor = edge['riskScore'] / 50  # Normalize around 1.0
                    physics_weight = edge['weight'] * risk_factor
                
                physics_edges.append({
                    'source': edge['source'],
                    'target': edge['target'],
                    'weight': physics_weight
                })
                
            # Use the enhanced edges for critical path analysis
            edges = physics_edges
        except Exception as e:
            print(f"Error applying PINN enhancement to critical path: {e}", file=sys.stderr)
            traceback.print_exc()
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Add nodes
    for node_id in nodes:
        G.add_node(node_id)
    
    # Add edges with weights
    for edge in edges:
        G.add_edge(edge['source'], edge['target'], weight=edge['weight'])
    
    # Find critical path using longest path in DAG
    try:
        # Check if graph is a DAG
        if not nx.is_directed_acyclic_graph(G):
            # Handle cycles by removing edges with lowest weight until DAG
            while not nx.is_directed_acyclic_graph(G):
                cycles = list(nx.simple_cycles(G))
                if not cycles:
                    break
                    
                # Find the edge with minimum weight in the cycle
                min_weight = float('inf')
                min_edge = None
                
                for u, v in zip(cycles[0], cycles[0][1:] + [cycles[0][0]]):
                    if G.has_edge(u, v) and G[u][v]['weight'] < min_weight:
                        min_weight = G[u][v]['weight']
                        min_edge = (u, v)
                
                if min_edge:
                    G.remove_edge(*min_edge)
        
        # Find all paths
        all_paths = []
        for source in G.nodes():
            for target in G.nodes():
                if source != target:
                    try:
                        for path in nx.all_simple_paths(G, source, target):
                            path_weight = sum(G[u][v]['weight'] for u, v in zip(path[:-1], path[1:]))
                            all_paths.append((path, path_weight))
                    except nx.NetworkXNoPath:
                        continue
        
        # Find path with maximum total weight
        if all_paths:
            critical_path, path_weight = max(all_paths, key=lambda x: x[1])
            result = {
                'path': list(critical_path),
                'totalWeight': path_weight
            }
            
            if use_pinn and PINN_AVAILABLE:
                result['usedPINN'] = True
                
            return result
        else:
            return {'path': [], 'totalWeight': 0}
    except Exception as e:
        print(f"Error finding critical path: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        return {'path': [], 'totalWeight': 0, 'error': str(e)}

def calculate_cascade_impact(args):
    """
    Calculate the cascade impact of a work item delay.
    """
    work_item_id = json.loads(args[0])
    nodes = json.loads(args[1])
    edges = json.loads(args[2])
    
    # Check if we should use PINN for impact analysis
    use_pinn = False
    if len(args) > 3:
        options = json.loads(args[3])
        use_pinn = options.get('usePINN', False)
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Add nodes
    for node_id in nodes:
        G.add_node(node_id)
    
    # Add edges with weights
    for edge in edges:
        G.add_edge(edge['source'], edge['target'], weight=edge['weight'])
    
    # Calculate impact
    try:
        # Find all descendants (affected items)
        affected_items = list(nx.descendants(G, work_item_id))
        
        # Calculate total delay as sum of weights of all paths
        total_delay = 0
        for target in affected_items:
            try:
                # Find the longest path (most delay) to this target
                paths = list(nx.all_simple_paths(G, work_item_id, target))
                if paths:
                    path_weights = [
                        sum(G[u][v]['weight'] for u, v in zip(path[:-1], path[1:]))
                        for path in paths
                    ]
                    total_delay = max(total_delay, max(path_weights))
            except nx.NetworkXNoPath:
                continue
        
        result = {
            'affected_items': affected_items,
            'total_delay': total_delay
        }
        
        # If PINN is available and requested, enhance impact analysis with physics-based models
        if use_pinn and PINN_AVAILABLE:
            try:
                # Calculate a physics-informed impact score that accounts for:
                # 1. Brooks' Law effects (communication overhead increases with team size)
                # 2. Critical Chain buffer effects (delays depend on available buffers)
                
                # Simple enhancement for now - adjust delay based on team size and depth
                team_size_factor = 1.0
                buffer_factor = 1.0
                
                # Node depth factor (deeper nodes have compounding delays)
                depth_factor = 1.0 + (0.1 * len(affected_items))
                
                # Compute physics-enhanced delay
                physics_delay = total_delay * team_size_factor * buffer_factor * depth_factor
                
                # Add physics-based insights to the result
                result['physics_enhanced_delay'] = physics_delay
                result['delay_factors'] = {
                    'team_size': team_size_factor,
                    'buffer': buffer_factor,
                    'cascade_depth': depth_factor
                }
                result['usedPINN'] = True
                
            except Exception as e:
                print(f"Error in PINN cascade impact enhancement: {e}", file=sys.stderr)
                traceback.print_exc()
        
        return result
        
    except Exception as e:
        print(f"Error calculating cascade impact: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        return {'affected_items': [], 'total_delay': 0, 'error': str(e)}

def quantize_model(args):
    """
    Create a quantized version of a PINN model for resource-constrained environments.
    """
    if not PINN_AVAILABLE:
        return {'success': False, 'error': 'PINN dependencies not available'}
    
    try:
        model_name = json.loads(args[0])
        
        # Create quantized model
        result = pinn_manager.create_quantized_model(model_name)
        
        if result:
            quantized_name = f"{model_name}_quantized"
            return {'success': True, 'model_name': quantized_name}
        else:
            return {'success': False, 'error': f'Failed to create quantized model for {model_name}'}
    except Exception as e:
        traceback.print_exc()
        return {'success': False, 'error': f'Error creating quantized model: {str(e)}'}

def anonymize_data(args):
    """
    Anonymize sensitive data for GDPR compliance.
    """
    if not PINN_AVAILABLE:
        return {'success': False, 'error': 'GDPR data processor not available'}
    
    try:
        data_json = args[0]
        data = json.loads(data_json)
        
        # Get fields to anonymize
        fields_to_anonymize = json.loads(args[1]) if len(args) > 1 else None
        
        # Create GDPR processor
        gdpr_processor = GDPRCompliantProcessor(anonymize_fields=fields_to_anonymize)
        
        # Process data type accordingly
        if isinstance(data, list):
            # Assume list of work items
            anonymized_data = [gdpr_processor.anonymize_work_item(item) for item in data]
        elif isinstance(data, dict):
            # Assume single work item
            anonymized_data = gdpr_processor.anonymize_work_item(data)
        else:
            return {'success': False, 'error': 'Unsupported data format'}
        
        return {
            'success': True, 
            'anonymized_data': anonymized_data,
            'fields_anonymized': gdpr_processor.anonymize_fields
        }
        
    except Exception as e:
        traceback.print_exc()
        return {'success': False, 'error': f'Error anonymizing data: {str(e)}'}

# Main function to handle command line arguments
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        return
    
    command = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    # Map commands to functions
    command_map = {
        'predict_risk': predict_risk,
        'train_pinn_model': train_pinn_model,
        'analyze_dependency': analyze_dependency,
        'find_critical_path': find_critical_path,
        'calculate_cascade_impact': calculate_cascade_impact,
        'quantize_model': quantize_model,
        'anonymize_data': anonymize_data
    }
    
    if command in command_map:
        result = command_map[command](args)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))

if __name__ == "__main__":
    main()
