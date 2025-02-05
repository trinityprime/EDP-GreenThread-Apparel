using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Http;
using System.Linq;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Find parameters of type IFormFile
        var fileParams = context.ApiDescription.ParameterDescriptions
            .Where(p => p.ParameterDescriptor.ParameterType == typeof(IFormFile))
            .ToList();

        // Modify the schema for each IFormFile parameter
        foreach (var param in fileParams)
        {
            var fileParam = operation.Parameters.FirstOrDefault(p => p.Name == param.Name);
            if (fileParam != null)
            {
                fileParam.Schema = new OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                };
            }
        }
    }
}
