using AutoMapper;
using LearningAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CSCatgeoryController(MyDbContext context, IConfiguration configuration, IMapper mapper,
        ILogger<CSCatgeoryController> logger) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> AddCSCategory(AddCSCategory csCategory)
        {
            try
            {
                // Trim string values
                csCategory.CSCategoryName = csCategory.CSCategoryName.Trim();

                // Check
                var foundCategory = await context.CSCategories.Where(x => x.CSCategoryName == csCategory.CSCategoryName).FirstOrDefaultAsync();
                if (foundCategory != null)
                {
                    string message = "Category already exists.";
                    return BadRequest(new { message });
                }

                // Create user object
                var now = DateTime.Now;
                var cscategory = new CSCategory()
                {
                    CSCategoryName = csCategory.CSCategoryName,
                    CreatedAt = now
                };

                // Add user
                await context.CSCategories.AddAsync(cscategory);
                await context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding category");
                return StatusCode(500);
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<CSCategoryDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                IQueryable<CSCategory> result = context.CSCategories;
                if (search != null)
                {
                    result = result.Where(x => x.CSCategoryName.Contains(search));
                }
                var list = await result.OrderByDescending(x => x.CreatedAt).ToListAsync();
                IEnumerable<CSCategoryDTO> data = list.Select(mapper.Map<CSCategoryDTO>);
                return Ok(data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when get all category");
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var myCategory = context.CSCategories.Find(id);
                if (myCategory == null)
                {
                    return NotFound();
                }

                context.CSCategories.Remove(myCategory);
                await context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when delete category");
                return StatusCode(500);
            }
        }


    }
}