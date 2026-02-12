"""
AI Risk Engine using OpenRouter API with nemotron-3-nano-30b-a3b model.
"""

import json
import logging
from typing import Any, Dict, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class AIRiskEngine:
    """
    AI-powered risk analysis engine using OpenRouter API.
    
    This service analyzes DeFi transactions and returns risk scores
    and recommendations using the nemotron-3-nano-30b-a3b model.
    """
    
    def __init__(self) -> None:
        """Initialize the AI Risk Engine."""
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.AI_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured")
    
    async def analyze_transaction(
        self,
        transaction_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze a transaction and return risk assessment.
        
        Args:
            transaction_data: Dictionary containing transaction details
                - type: Transaction type (e.g., "transfer", "swap", "stake")
                - amount: Amount in ALGO
                - recipient: Recipient address
                - sender: Sender address
                - timestamp: Transaction timestamp
                - protocol: Optional protocol name
                - additional_context: Any additional context
        
        Returns:
            Dictionary containing:
                - risk_score: Risk score (0-100)
                - recommendation: "ALLOW", "WARN", or "BLOCK"
                - reasoning: Explanation of the risk assessment
                - model_used: Model name used for analysis
                - confidence: Confidence level (0-1)
        """
        prompt = self._build_analysis_prompt(transaction_data)
        
        try:
            result = await self._call_openrouter(prompt)
            return self._parse_ai_response(result)
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            # Return safe default on error
            return self._get_default_response()
    
    async def batch_analyze(
        self,
        transactions: list[Dict[str, Any]]
    ) -> list[Dict[str, Any]]:
        """
        Analyze multiple transactions in batch.
        
        Args:
            transactions: List of transaction data dictionaries
        
        Returns:
            List of risk analysis results
        """
        results = []
        for tx in transactions:
            result = await self.analyze_transaction(tx)
            results.append(result)
        return results
    
    def _build_analysis_prompt(self, transaction_data: Dict[str, Any]) -> str:
        """Build the analysis prompt for the AI model."""
        tx_type = transaction_data.get("type", "unknown")
        amount = transaction_data.get("amount", "0")
        recipient = transaction_data.get("recipient", "unknown")
        sender = transaction_data.get("sender", "unknown")
        protocol = transaction_data.get("protocol", "unknown")
        
        prompt = f"""You are a DeFi security analyst specializing in Algorand blockchain transactions. Analyze the following transaction for potential risks.

Transaction Details:
- Type: {tx_type}
- Amount: {amount} ALGO
- Sender: {sender}
- Recipient: {recipient}
- Protocol: {protocol}
- Timestamp: {transaction_data.get('timestamp', 'unknown')}

Risk Factors to Consider:
1. Is this a suspicious transaction pattern?
2. Could this be a scam or phishing attempt?
3. Is the amount unusually large for this type of transaction?
4. Is the recipient address new or unknown?
5. Are there any red flags in the transaction metadata?
6. Is this a known high-risk protocol?

Provide your analysis in the following JSON format:
{{
    "risk_score": <number from 0 to 100>,
    "recommendation": "ALLOW" | "WARN" | "BLOCK",
    "reasoning": "<brief explanation of your assessment>",
    "confidence": <number from 0 to 1>
}}

Risk Score Guidelines:
- 0-30: Low risk - Safe to proceed
- 31-60: Medium risk - Proceed with caution
- 61-100: High risk - Block or require additional verification

Return ONLY the JSON object, no additional text."""
        
        return prompt
    
    async def _call_openrouter(self, prompt: str) -> Dict[str, Any]:
        """
        Call the OpenRouter API with the given prompt.
        
        Args:
            prompt: The prompt to send to the AI model
        
        Returns:
            The API response
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://chainguardian.app",
            "X-Title": "ChainGuardian",
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a DeFi security analyst. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 500,
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    def _parse_ai_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse the AI response and extract risk analysis.
        
        Args:
            response: The raw API response
        
        Returns:
            Parsed risk analysis dictionary
        """
        try:
            content = response["choices"][0]["message"]["content"]
            analysis = json.loads(content)
            
            # Validate and sanitize the response
            risk_score = min(100, max(0, int(analysis.get("risk_score", 50))))
            recommendation = analysis.get("recommendation", "WARN")
            reasoning = analysis.get("reasoning", "Analysis complete")
            confidence = min(1.0, max(0.0, float(analysis.get("confidence", 0.5))))
            
            # Validate recommendation
            if recommendation not in ["ALLOW", "WARN", "BLOCK"]:
                recommendation = "WARN"
            
            return {
                "risk_score": risk_score,
                "recommendation": recommendation,
                "reasoning": reasoning,
                "model_used": self.model,
                "confidence": confidence,
            }
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse AI response: {e}")
            return self._get_default_response()
    
    def _get_default_response(self) -> Dict[str, Any]:
        """Return a safe default response when AI analysis fails."""
        return {
            "risk_score": 50,
            "recommendation": "WARN",
            "reasoning": "AI analysis unavailable - manual review recommended",
            "model_used": "fallback",
            "confidence": 0.0,
        }
    
    async def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the AI model being used.
        
        Returns:
            Dictionary with model information
        """
        return {
            "model": self.model,
            "provider": "OpenRouter",
            "api_base": self.base_url,
            "configured": bool(self.api_key),
        }


# Singleton instance
_ai_engine: Optional[AIRiskEngine] = None


def get_ai_engine() -> AIRiskEngine:
    """Get or create the AI engine singleton instance."""
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = AIRiskEngine()
    return _ai_engine
