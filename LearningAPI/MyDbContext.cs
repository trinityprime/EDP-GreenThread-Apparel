using LearningAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LearningAPI
{
	public class MyDbContext : DbContext
    {
        private readonly IConfiguration _configuration;

        // Constructor with Dependency Injection for IConfiguration
        public MyDbContext(IConfiguration configuration) : base()
        {
            _configuration = configuration;
        }

        // OnConfiguring method is used for setting up the connection string
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string? connectionString = _configuration.GetConnectionString("MyConnection");
            if (connectionString != null)
            {
                optionsBuilder.UseSqlServer(connectionString);
            }
        }

        // DbSets for the different entities
 
        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }

        // Configure relationships between entities

    }
}
