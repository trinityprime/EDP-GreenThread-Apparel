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
		public DbSet<Product> Products { get; set; }
		public DbSet<ProductCategory> ProductCategory { get; set; }

		public DbSet<ShoppingCart> ShoppingCarts { get; set; }
		public DbSet<Payment> Payments { get; set; }

		public DbSet<CustomerService> CustomerServices { get; set; }


		public DbSet<Order> Orders { get; set; }
		public DbSet<Delivery> Deliveries { get; set; }

		public DbSet<Refund> Refunds { get; set; }

		// Configure relationships between entities
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			// Prevent cascade delete for User in Orders
			modelBuilder.Entity<Order>()
				.HasOne(o => o.User)
				.WithMany()
				.HasForeignKey(o => o.UserID)
				.OnDelete(DeleteBehavior.NoAction); // ✅ FIX: Prevents multiple cascade paths

			// Keep cascade delete for Payments
			modelBuilder.Entity<Order>()
				.HasOne(o => o.Payment)
				.WithMany()
				.HasForeignKey(o => o.PaymentID)
				.OnDelete(DeleteBehavior.Cascade); // ✅ Orders will be deleted if Payment is deleted

			modelBuilder.Entity<Product>()
				.HasOne(p => p.ProductCategory)
				.WithMany(c => c.Products)
				.HasForeignKey(p => p.ProductCategoryID);

			modelBuilder.Entity<Refund>()
				.HasOne(r => r.User)
				.WithMany()
				.HasForeignKey(r => r.UserID)
				.OnDelete(DeleteBehavior.NoAction); // Prevent cascading delete

			modelBuilder.Entity<Refund>()
				.HasOne(r => r.Order)
				.WithMany()
				.HasForeignKey(r => r.OrderID)
				.OnDelete(DeleteBehavior.NoAction);
		}

	}
}
