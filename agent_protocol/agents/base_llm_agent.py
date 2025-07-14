"""Base LLM-powered agent implementation."""

from typing import Dict, Any, List, Optional
import json
import logging

from ..core.base_agent import BaseAgent
from ..core.agent_result import AgentResult
from ..core.agent_context import AgentContext
from ..prompts.prompt_manager import PromptManager
from ..llm.llm_client import LLMClient, LLMResponse
from config.llm_config import get_agent_llm_config


class BaseLLMAgent(BaseAgent):
    """Base class for LLM-powered agents."""
    
    def __init__(self, agent_id: str, agent_type, name: str, 
                 description: str, config: Dict[str, Any]):
        """Initialize LLM agent."""
        super().__init__(agent_id, agent_type, name, description, config)
        
        # Initialize prompt manager
        self.prompt_manager = PromptManager()
        
        # LLM configuration
        self.llm_config = get_agent_llm_config(agent_type.value)
        self.llm_client: Optional[LLMClient] = None
        
        # Conversation management
        self.max_conversation_length = config.get('max_conversation_length', 10)
        
    def _initialize_llm_client(self):
        """Initialize the LLM client. Override in subclasses if needed."""
        # This would be implemented with actual provider initialization
        # For now, it's a placeholder
        pass
    
    def _execute_core_logic(self, context: AgentContext) -> AgentResult:
        """Execute agent logic using LLM."""
        try:
            # Initialize LLM client if needed
            if not self.llm_client:
                self._initialize_llm_client()
            
            # Get system prompt
            tool_descriptions = self.get_tool_descriptions()
            system_prompt = self.prompt_manager.get_system_prompt(
                agent_type=self.agent_type.value,
                agent_name=self.name,
                tools=tool_descriptions,
                context={
                    'org_id': context.org_id,
                    'user_id': context.user_id
                }
            )
            
            # Prepare user input
            user_input = self._prepare_user_input(context.input_data)
            
            # Add initial reasoning
            context.add_reasoning_step("Analyzing user request")
            
            # Execute LLM reasoning loop
            max_iterations = 5
            iteration = 0
            
            while iteration < max_iterations:
                iteration += 1
                context.add_reasoning_step(f"Iteration {iteration}: Thinking...")
                
                # Get conversation history
                conversation = self._get_conversation_history(context)
                
                # Format messages
                messages = self.llm_client.format_messages(
                    system_prompt=system_prompt,
                    user_input=user_input if iteration == 1 else "",
                    conversation_history=conversation if iteration > 1 else None
                )
                
                # Add tool descriptions to the request
                if self._tools:
                    # Call LLM with tools
                    response = self._call_llm_with_tools(messages, tool_descriptions)
                else:
                    # Regular LLM call
                    response = self._call_llm(messages)
                
                # Update token usage
                context.tokens_used += response.total_tokens
                
                # Process LLM response
                action = self._process_llm_response(response, context)
                
                # Check if we should continue or return result
                if action.get('type') == 'final_answer':
                    return self._create_final_result(action, context)
                elif action.get('type') == 'tool_call':
                    # Execute tool
                    tool_result = self._execute_tool_call(action, context)
                    # Add to conversation
                    context.conversation_history.append({
                        'role': 'assistant',
                        'content': f"Tool call: {action['tool']} with {action['parameters']}"
                    })
                    context.conversation_history.append({
                        'role': 'tool',
                        'content': json.dumps(tool_result.to_dict())
                    })
                else:
                    # Continue conversation
                    context.conversation_history.append({
                        'role': 'assistant',
                        'content': response.content
                    })
            
            # Max iterations reached
            context.add_reasoning_step("Maximum iterations reached, preparing final response")
            return AgentResult(
                success=True,
                message="Analysis completed with maximum iterations",
                data=self._extract_final_data(context),
                confidence=0.7  # Lower confidence due to iteration limit
            )
            
        except Exception as e:
            self.logger.error(f"LLM agent execution failed: {str(e)}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"Agent execution failed: {str(e)}",
                error_type=type(e).__name__
            )
    
    def _prepare_user_input(self, input_data: Dict[str, Any]) -> str:
        """Prepare user input for LLM."""
        # Convert input data to a structured prompt
        if 'query' in input_data:
            return input_data['query']
        elif 'action' in input_data:
            action = input_data['action']
            params = {k: v for k, v in input_data.items() if k != 'action'}
            return f"Action: {action}\\nParameters: {json.dumps(params, indent=2)}"
        else:
            return json.dumps(input_data, indent=2)
    
    def _get_conversation_history(self, context: AgentContext) -> List[Dict[str, str]]:
        """Get conversation history from context."""
        # Limit conversation length
        history = context.conversation_history[-self.max_conversation_length:]
        return history
    
    def _call_llm(self, messages: List[Dict[str, str]]) -> LLMResponse:
        """Call LLM without tools."""
        # This would be implemented with actual LLM call
        # For now, return a mock response
        return LLMResponse(
            content="I need to analyze the supply chain data to provide insights.",
            model=self.llm_config['model'],
            provider=self.llm_config['provider'],
            usage={'total_tokens': 50}
        )
    
    def _call_llm_with_tools(self, messages: List[Dict[str, str]], 
                            tools: List[Dict[str, Any]]) -> LLMResponse:
        """Call LLM with tool support."""
        # This would be implemented with actual LLM call
        # For now, return a mock response
        return LLMResponse(
            content="I'll analyze the inventory data using the available tools.",
            model=self.llm_config['model'],
            provider=self.llm_config['provider'],
            usage={'total_tokens': 75}
        )
    
    def _process_llm_response(self, response: LLMResponse, 
                             context: AgentContext) -> Dict[str, Any]:
        """Process LLM response and determine next action."""
        content = response.content.lower()
        
        # Simple pattern matching for demonstration
        if "final answer:" in content or "conclusion:" in content:
            return {
                'type': 'final_answer',
                'content': response.content
            }
        elif "use tool" in content or "call tool" in content:
            # Extract tool call (simplified)
            return {
                'type': 'tool_call',
                'tool': 'database_query',  # Mock tool
                'parameters': {'table': 'triangles', 'limit': 10}
            }
        else:
            return {
                'type': 'continue',
                'content': response.content
            }
    
    def _execute_tool_call(self, action: Dict[str, Any], 
                          context: AgentContext) -> Any:
        """Execute a tool call."""
        tool_name = action['tool']
        parameters = action['parameters']
        
        context.add_reasoning_step(f"Executing tool: {tool_name}")
        
        try:
            result = self.call_tool(tool_name, parameters)
            context.add_evidence(
                source=f"Tool:{tool_name}",
                data=result,
                confidence=0.9
            )
            return result
        except Exception as e:
            self.logger.error(f"Tool execution failed: {str(e)}")
            context.add_error("ToolError", str(e))
            raise
    
    def _create_final_result(self, action: Dict[str, Any], 
                           context: AgentContext) -> AgentResult:
        """Create final result from LLM action."""
        result = AgentResult(
            success=True,
            message="Analysis completed successfully",
            data=self._extract_final_data(context),
            confidence=self._calculate_confidence(context)
        )
        
        # Add insights and recommendations
        self._add_insights_and_recommendations(result, context)
        
        return result
    
    def _extract_final_data(self, context: AgentContext) -> Dict[str, Any]:
        """Extract final data from context."""
        return {
            'analysis_summary': context.output_data,
            'evidence_count': len(context.evidence),
            'tools_used': [tool['tool'] for tool in context.tools_used],
            'iterations': len([s for s in context.reasoning_steps if 'Iteration' in s])
        }
    
    def _calculate_confidence(self, context: AgentContext) -> float:
        """Calculate overall confidence score."""
        if not context.evidence:
            return 0.5
        
        # Average confidence from evidence
        confidences = [e.get('confidence', 0.5) for e in context.evidence]
        return sum(confidences) / len(confidences)
    
    def _add_insights_and_recommendations(self, result: AgentResult, 
                                         context: AgentContext):
        """Add insights and recommendations to result."""
        # This would analyze the context and evidence to generate insights
        # For now, add sample insights
        
        if context.evidence:
            result.add_insight(
                category="data_quality",
                insight=f"Analysis based on {len(context.evidence)} evidence sources",
                severity="info"
            )
        
        if context.tool_call_count > 0:
            result.add_recommendation(
                title="Data Coverage",
                description=f"Analyzed data using {context.tool_call_count} tool calls",
                impact="medium"
            )