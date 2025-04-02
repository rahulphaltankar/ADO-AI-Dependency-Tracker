#!/usr/bin/env python3
import sys
import json
import numpy as np
import networkx as nx

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
    factors = json.loads(args[0])
    team_velocity = factors.get('teamVelocity', 50)
    dependency_complexity = factors.get('dependencyComplexity', 50)
    resource_allocation = factors.get('resourceAllocation', 50)
    
    risk = risk_model.predict(team_velocity, dependency_complexity, resource_allocation)
    return {'risk': risk}

def analyze_dependency(args):
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
    
    return results

def find_critical_path(args):
    nodes = json.loads(args[0])
    edges = json.loads(args[1])
    
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
            critical_path, _ = max(all_paths, key=lambda x: x[1])
            return {'path': list(critical_path)}
        else:
            return {'path': []}
    except Exception as e:
        print(f"Error finding critical path: {str(e)}", file=sys.stderr)
        return {'path': [], 'error': str(e)}

def calculate_cascade_impact(args):
    work_item_id = json.loads(args[0])
    nodes = json.loads(args[1])
    edges = json.loads(args[2])
    
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
        
        return {
            'affected_items': affected_items,
            'total_delay': total_delay
        }
    except Exception as e:
        print(f"Error calculating cascade impact: {str(e)}", file=sys.stderr)
        return {'affected_items': [], 'total_delay': 0, 'error': str(e)}

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
        'analyze_dependency': analyze_dependency,
        'find_critical_path': find_critical_path,
        'calculate_cascade_impact': calculate_cascade_impact
    }
    
    if command in command_map:
        result = command_map[command](args)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))

if __name__ == "__main__":
    main()
