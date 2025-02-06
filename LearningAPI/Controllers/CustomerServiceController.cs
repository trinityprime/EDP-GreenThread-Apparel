using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LearningAPI.Models;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerServiceController : ControllerBase
    {
        private readonly MyDbContext _context;

        public CustomerServiceController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 GET All Customer Service Requests
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.CustomerServices.Include(cs => cs.User).ToListAsync();
            return Ok(requests);
        }

        // 📌 GET a Single Customer Service Request by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var request = await _context.CustomerServices.Include(cs => cs.User)
                                .FirstOrDefaultAsync(cs => cs.CustomerServiceID == id);

            if (request == null)
                return NotFound("Customer service request not found.");

            return Ok(request);
        }

        // ➕ POST Create a New Customer Service Request
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerService request)
        {
            if (request == null)
                return BadRequest("Invalid request data.");

            request.CreatedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;
            request.Status = CustomerServiceStatus.Pending;

            _context.CustomerServices.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = request.CustomerServiceID }, request);
        }

        // ✏️ PUT Update Customer Service Request (User Can Update Only Comment & NeedReply)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CustomerService request)
        {
            var existingRequest = await _context.CustomerServices.FindAsync(id);
            if (existingRequest == null)
                return NotFound("Customer service request not found.");

            existingRequest.Comment = request.Comment;
            existingRequest.NeedReply = request.NeedReply;
            existingRequest.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existingRequest);
        }

        // 🔄 PATCH Update Admin Note and Status (Only Admins Should Use This)
        [HttpPatch("{id}/admin-update")]
        public async Task<IActionResult> AdminUpdate(int id, [FromBody] CustomerService request)
        {
            var existingRequest = await _context.CustomerServices.FindAsync(id);
            if (existingRequest == null)
                return NotFound("Customer service request not found.");

            existingRequest.AdminNote = request.AdminNote;
            existingRequest.Status = request.Status;
            existingRequest.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Customer service request updated by admin." });
        }

        // 🗑️ DELETE Remove a Customer Service Request
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var request = await _context.CustomerServices.FindAsync(id);
            if (request == null)
                return NotFound("Customer service request not found.");

            _context.CustomerServices.Remove(request);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
