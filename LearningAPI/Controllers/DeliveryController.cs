//using Microsoft.AspNetCore.Mvc;
//using EDP_API.Models;
//using System.Linq;
//using LearningAPI;

//namespace EDP_API.Controllers
//{
//    [ApiController]
//    [Route("[controller]")]
//    public class DeliveryController : ControllerBase
//    {
//        private readonly MyDbContext _context;

//        public DeliveryController(MyDbContext context)
//        {
//            _context = context;
//        }
//        // GET: /Delivery
//        [HttpGet]
//        public IActionResult GetAll()
//        {
//            var deliveries = _context.Deliveries
//                .OrderByDescending(x => x.CreatedAt)
//                .ToList();

//            return Ok(deliveries);
//        }

//        // GET: /Delivery/{id}
//        [HttpGet("{id}")]
//        public IActionResult GetById(int id)
//        {
//            var delivery = _context.Deliveries.FirstOrDefault(x => x.DeliveryID == id);
//            if (delivery == null)
//            {
//                return NotFound(new { Message = $"Delivery with ID {id} not found." });
//            }
//            return Ok(delivery);
//        }
//        // POST: /Delivery
//        [HttpPost]
//        public IActionResult AddDelivery([FromBody] Delivery delivery)
//        {
//            // Validate input
//            if (delivery == null)
//            {
//                return BadRequest(new { Message = "Delivery data is required." });
//            }

//            if (string.IsNullOrWhiteSpace(delivery.Address))
//            {
//                return BadRequest(new { Message = "Delivery address is required." });
//            }

//            var now = DateTime.Now;

//            var newDelivery = new Delivery
//            {
//                OrderID = delivery.OrderID,
//                Address = delivery.Address.Trim(),
//                DeliveryStatus = delivery.DeliveryStatus,
//                CreatedAt = now,
//                UpdatedAt = now
//            };
//            _context.Deliveries.Add(newDelivery);
//            _context.SaveChanges();

//            return CreatedAtAction(nameof(GetById), new { id = newDelivery.DeliveryID }, newDelivery);
//        }

//        // PUT: /Delivery/{id}
//        [HttpPut("{id}")]
//        public IActionResult UpdateDelivery(int id, [FromBody] Delivery delivery)
//        {
//            if (delivery == null || id != delivery.DeliveryID)
//            {
//                return BadRequest(new { Message = "Invalid data or ID mismatch." });
//            }

//            var existingDelivery = _context.Deliveries.FirstOrDefault(x => x.DeliveryID == id);
//            if (existingDelivery == null)
//            {
//                return NotFound(new { Message = $"Delivery with ID {id} not found." });
//            }
//            existingDelivery.OrderID = delivery.OrderID;
//            existingDelivery.Address = delivery.Address.Trim();
//            existingDelivery.DeliveryStatus = delivery.DeliveryStatus;
//            existingDelivery.UpdatedAt = DateTime.Now;

//            _context.SaveChanges();

//            return NoContent();
//        }

//        // DELETE: /Delivery/{id}
//        [HttpDelete("{id}")]
//        public IActionResult DeleteDelivery(int id)
//        {
//            var delivery = _context.Deliveries.FirstOrDefault(x => x.DeliveryID == id);
//            if (delivery == null)
//            {
//                return NotFound(new { Message = $"Delivery with ID {id} not found." });
//            }

//            _context.Deliveries.Remove(delivery);
//            _context.SaveChanges();

//            return NoContent();
//        }
//    }
//}