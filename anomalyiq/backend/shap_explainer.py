"""
AnomalyIQ - SHAP Explainability Module
REQUIREMENT 6: SHAP explainability for all transactions

This module provides:
- SHAP values for every flagged transaction
- Waterfall plots showing feature contributions
- Summary plots for global understanding
- Force plots for individual explanations

Author: Paschal Nwagor O.
"""

import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json


class SHAPExplainer:
    """
    SHAP-based explainability for fraud detection
    """
    
    def __init__(self, model, X_background, feature_names=None):
        """
        Initialize SHAP explainer
        
        Args:
            model: Trained model (LightGBM, Isolation Forest, etc.)
            X_background: Background dataset for SHAP (sample of training data)
            feature_names: List of feature names
        """
        self.model = model
        self.feature_names = feature_names
        
        # Create SHAP explainer
        try:
            # For tree-based models (LightGBM)
            self.explainer = shap.TreeExplainer(model)
            print("✓ SHAP TreeExplainer initialized")
        except:
            # Fallback to KernelExplainer
            self.explainer = shap.KernelExplainer(
                model.predict_proba,
                shap.sample(X_background, 100)
            )
            print("✓ SHAP KernelExplainer initialized")
    
    def explain_transaction(self, transaction):
        """
        Get SHAP explanation for a single transaction
        
        Args:
            transaction: Single transaction (1D array or DataFrame row)
            
        Returns:
            dict: SHAP values and explanation
        """
        # Ensure transaction is 2D
        if len(transaction.shape) == 1:
            transaction = transaction.reshape(1, -1)
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(transaction)
        
        # Handle different SHAP value formats
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # For binary classification
        
        # Get base value
        if hasattr(self.explainer, 'expected_value'):
            base_value = self.explainer.expected_value
            if isinstance(base_value, np.ndarray):
                base_value = base_value[1]  # For binary classification
        else:
            base_value = 0
        
        # Create explanation dictionary
        explanation = {
            'shap_values': shap_values[0].tolist() if len(shap_values.shape) > 1 else shap_values.tolist(),
            'base_value': float(base_value),
            'feature_values': transaction[0].tolist(),
            'feature_names': self.feature_names if self.feature_names else [f"V{i}" for i in range(len(transaction[0]))]
        }
        
        # Add feature contributions (sorted by importance)
        contributions = []
        for i, (name, value, shap_val) in enumerate(zip(
            explanation['feature_names'],
            explanation['feature_values'],
            explanation['shap_values']
        )):
            contributions.append({
                'feature': name,
                'value': float(value),
                'shap_value': float(shap_val),
                'contribution': 'increases' if shap_val > 0 else 'decreases'
            })
        
        # Sort by absolute SHAP value (most important first)
        contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        explanation['top_features'] = contributions[:10]  # Top 10 features
        
        return explanation
    
    def explain_batch(self, transactions):
        """
        Get SHAP explanations for multiple transactions
        
        Args:
            transactions: Multiple transactions (2D array or DataFrame)
            
        Returns:
            list: List of explanations
        """
        explanations = []
        
        for i in range(len(transactions)):
            transaction = transactions[i:i+1]
            explanation = self.explain_transaction(transaction)
            explanations.append(explanation)
        
        return explanations
    
    def create_waterfall_plot_data(self, explanation):
        """
        Create data for waterfall plot (for frontend visualization)
        
        Args:
            explanation: SHAP explanation dict
            
        Returns:
            dict: Waterfall plot data
        """
        waterfall_data = {
            'base_value': explanation['base_value'],
            'features': []
        }
        
        # Get top features
        for feat in explanation['top_features'][:10]:
            waterfall_data['features'].append({
                'name': feat['feature'],
                'value': feat['value'],
                'shap': feat['shap_value'],
                'color': 'red' if feat['shap_value'] > 0 else 'blue'
            })
        
        return waterfall_data
    
    def get_explanation_text(self, explanation, fraud_probability):
        """
        Generate human-readable explanation text
        
        Args:
            explanation: SHAP explanation dict
            fraud_probability: Fraud probability (0-1)
            
        Returns:
            str: Human-readable explanation
        """
        text = f"This transaction has a {fraud_probability*100:.1f}% fraud probability.\n\n"
        
        text += "Top contributing factors:\n\n"
        
        for i, feat in enumerate(explanation['top_features'][:5], 1):
            direction = "INCREASES" if feat['shap_value'] > 0 else "DECREASES"
            text += f"{i}. {feat['feature']} = {feat['value']:.4f}\n"
            text += f"   {direction} fraud risk by {abs(feat['shap_value']):.4f}\n\n"
        
        return text
    
    def create_global_summary(self, X_test, sample_size=100):
        """
        Create global SHAP summary
        
        Args:
            X_test: Test dataset
            sample_size: Number of samples to use
            
        Returns:
            dict: Global feature importance
        """
        # Sample data
        if len(X_test) > sample_size:
            indices = np.random.choice(len(X_test), sample_size, replace=False)
            X_sample = X_test[indices]
        else:
            X_sample = X_test
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X_sample)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        # Calculate mean absolute SHAP values
        mean_shap = np.abs(shap_values).mean(axis=0)
        
        # Create feature importance ranking
        feature_importance = []
        for i, importance in enumerate(mean_shap):
            feature_name = self.feature_names[i] if self.feature_names else f"V{i}"
            feature_importance.append({
                'feature': feature_name,
                'importance': float(importance)
            })
        
        # Sort by importance
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return {
            'global_importance': feature_importance[:20],  # Top 20
            'total_features': len(mean_shap)
        }


# Example usage
if __name__ == "__main__":
    print("AnomalyIQ SHAP Explainability Module")
    print("Provides explanations for every flagged transaction!")