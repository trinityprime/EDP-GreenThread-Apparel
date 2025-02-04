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
    public class ProductCategoryController(MyDbContext context, IConfiguration configuration, IMapper mapper,
        ILogger<ProductCategoryController> logger) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> AddProductCategory(AddProductCategory productCategory)
        {
            try
            {
                // Trim string values
                productCategory.ProductCategoryName = productCategory.ProductCategoryName.Trim();

                // Check
                var foundCategory = await context.ProductCategories.Where(x => x.ProductCategoryName == productCategory.ProductCategoryName).FirstOrDefaultAsync();
                if (foundCategory != null)
                {
                    string message = "Category already exists.";
                    return BadRequest(new { message });
                }

                // Create user object
                var now = DateTime.Now;
                var category = new ProductCategory()
                {
                    ProductCategoryName = productCategory.ProductCategoryName,
                    CreatedAt = now
                };

                // Add user
                await context.ProductCategories.AddAsync(category);
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
        [ProducesResponseType(typeof(IEnumerable<ProductCategoryDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                IQueryable<ProductCategory> result = context.ProductCategories;
                if (search != null)
                {
                    result = result.Where(x => x.ProductCategoryName.Contains(search));
                }
                var list = await result.OrderByDescending(x => x.CreatedAt).ToListAsync();
                IEnumerable<ProductCategoryDTO> data = list.Select(mapper.Map<ProductCategoryDTO>);
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
                var myCategory = context.ProductCategories.Find(id);
                if (myCategory == null)
                {
                    return NotFound();
                }

                context.ProductCategories.Remove(myCategory);
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