using Microsoft.AspNetCore.Mvc;
using LearningAPI.Models;
using System.Linq;
using EDP_API;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DeliveryAgentController : ControllerBase
    {
        private readonly MyDbContext _context;

        public DeliveryAgentController(MyDbContext context)
        {
            _context = context;
        }

        // GET: /DeliveryAgent
        [HttpGet]
        public IActionResult GetAll()
        {
            IQueryable<DeliveryAgent> result = _context.DeliveryAgents;
            var list = result.OrderByDescending(x => x.DeliveryID).ToList();
            return Ok(list);
        }
        // GET: /DeliveryAgent/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var deliveryAgent = _context.DeliveryAgents.FirstOrDefault(x => x.DeliveryAgentID == id);
            if (deliveryAgent == null)
            {
                return NotFound($"Delivery Agent with ID {id} not found.");
            }
            return Ok(deliveryAgent);
        }
        // POST: /DeliveryAgent
        [HttpPost]
        public IActionResult AddDeliveryAgent([FromBody] DeliveryAgent deliveryAgent)
        {
            if (deliveryAgent == null)
            {
                return BadRequest("DeliveryAgent data is required.");
            }

            if (deliveryAgent.UserID == 0 || deliveryAgent.DeliveryID == 0 ||
                string.IsNullOrWhiteSpace(deliveryAgent.AgentName) ||
                string.IsNullOrWhiteSpace(deliveryAgent.AgentNumber) ||
                string.IsNullOrWhiteSpace(deliveryAgent.AgentUsername) ||
                string.IsNullOrWhiteSpace(deliveryAgent.AgentPassword))
            {
                return BadRequest("All fields are required: UserID, DeliveryID, AgentName, AgentNumber, AgentUsername, and AgentPassword.");
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(deliveryAgent.AgentNumber, @"^\+?\d{10,15}$"))
            {
                return BadRequest("Agent Number must be a valid phone number.");
            }

            if (deliveryAgent.AgentPassword.Length < 8 || deliveryAgent.AgentPassword.Length > 20)
            {
                return BadRequest("Password must be between 8 and 20 characters long.");
            }

            var newDeliveryAgent = new DeliveryAgent
            {
                UserID = deliveryAgent.UserID,
                DeliveryID = deliveryAgent.DeliveryID,
                AgentName = deliveryAgent.AgentName.Trim(),
                AgentNumber = deliveryAgent.AgentNumber.Trim(),
                AgentUsername = deliveryAgent.AgentUsername.Trim(),
                AgentPassword = deliveryAgent.AgentPassword.Trim()
            };

            _context.DeliveryAgents.Add(newDeliveryAgent);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { id = newDeliveryAgent.DeliveryAgentID }, newDeliveryAgent);
        }
        // PUT: /DeliveryAgent/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateDeliveryAgent(int id, [FromBody] DeliveryAgent deliveryAgent)
        {
            if (deliveryAgent == null || id != deliveryAgent.DeliveryAgentID)
            {
                return BadRequest("Invalid data or ID mismatch.");
            }

            var existingDeliveryAgent = _context.DeliveryAgents.FirstOrDefault(x => x.DeliveryAgentID == id);
            if (existingDeliveryAgent == null)
            {
                return NotFound($"Delivery Agent with ID {id} not found.");
            }

            existingDeliveryAgent.UserID = deliveryAgent.UserID;
            existingDeliveryAgent.DeliveryID = deliveryAgent.DeliveryID;
            existingDeliveryAgent.AgentName = deliveryAgent.AgentName.Trim();
            existingDeliveryAgent.AgentNumber = deliveryAgent.AgentNumber.Trim();
            existingDeliveryAgent.AgentUsername = deliveryAgent.AgentUsername.Trim();
            existingDeliveryAgent.AgentPassword = deliveryAgent.AgentPassword.Trim();

            _context.SaveChanges();

            return NoContent(); // Return 204 No Content to indicate successful update
        }
        // DELETE: /DeliveryAgent/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteDeliveryAgent(int id)
        {
            var deliveryAgent = _context.DeliveryAgents.FirstOrDefault(x => x.DeliveryAgentID == id);
            if (deliveryAgent == null)
            {
                return NotFound($"Delivery Agent with ID {id} not found.");
            }

            _context.DeliveryAgents.Remove(deliveryAgent);
            _context.SaveChanges();

            return NoContent(); // Return 204 No Content to indicate successful deletion
        }
    }
}