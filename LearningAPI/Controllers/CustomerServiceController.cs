using AutoMapper;
using LearningAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CustomerServiceController(MyDbContext context, IMapper mapper,
        ILogger<CustomerServiceController> logger) : ControllerBase
    {
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<CustomerServiceDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                IQueryable<CustomerService> result = context.CustomerServices;
                var list = await result.OrderByDescending(x => x.CreatedAt).ToListAsync();
                IEnumerable<CustomerServiceDTO> data = list.Select(mapper.Map<CustomerServiceDTO>);
                return Ok(data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when get all category");
                return StatusCode(500);
            }
        }

        [HttpGet("{userId}")]
        [ProducesResponseType(typeof(CustomerServiceDTO), StatusCodes.Status200OK)]
        public IActionResult GetCustomerService(int userId)
        {
            try
            {
                var customerService = context.CustomerServices
                .Include(cs => cs.CSCategory)  // Include the related category
                .FirstOrDefault(cs => cs.UserID == userId);  // Fetch by userID
                CustomerServiceDTO data = mapper.Map<CustomerServiceDTO>(customerService);
                if (data == null)
                {
                    return NotFound(new { message = "No customer service found for the specified user." });
                }
                return Ok(data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when get customer service by id");
                return StatusCode(500);
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(CustomerServiceDTO), StatusCodes.Status200OK)]
        public async Task<IActionResult> AddCustomerService(AddCustomerService customerService)
        {
            try
            {
                int userId = GetUserId();
                var now = DateTime.Now;
                var myCustomerService = new CustomerService()
                {
                    Comment = customerService.Comment.Trim(),
                    Status = CustomerServiceStatus.Pending,
                    CreatedAt = now,
                    UpdatedAt = now,
                    CSCategoryID = customerService.CSCategoryID
                };

                await context.CustomerServices.AddAsync(myCustomerService);
                await context.SaveChangesAsync();

                CustomerServiceDTO customerServiceDTO = mapper.Map<CustomerServiceDTO>(customerService);
                return Ok(customerServiceDTO);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when add customer service");
                return StatusCode(500);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomerService(int id, UpdateCustomerService customerService)
        {
            try
            {
                var myCustomerService = await context.CustomerServices.FindAsync(id);
                if (myCustomerService == null)
                {
                    return NotFound();
                }

                if (customerService.Status != null)
                {
                    myCustomerService.Status = customerService.Status;
                }
                if (customerService.AdminName != null)
                {
                    myCustomerService.AdminName = customerService.AdminName.Trim();
                }
                if (customerService.AdminNote != null)
                {
                    myCustomerService.AdminNote = customerService.AdminNote.Trim();
                }
                myCustomerService.UpdatedAt = DateTime.Now;

                await context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when update customer service");
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomerService(int id)
        {
            try
            {
                var myCustomerService = context.CustomerServices.Find(id);
                if (myCustomerService == null)
                {
                    return NotFound();
                }

                context.CustomerServices.Remove(myCustomerService);
                await context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when delete customer service");
                return StatusCode(500);
            }
        }

        private int GetUserId()
        {
            return Convert.ToInt32(User.Claims
                .Where(c => c.Type == ClaimTypes.NameIdentifier)
                .Select(c => c.Value).SingleOrDefault());
        }
    }
}
