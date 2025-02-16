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
		public DbSet<ShoppingCart> ShoppingCarts { get; set; }
        public DbSet<ShoppingCartItem> ShoppingCartItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
		public DbSet<CustomerService> CustomerServices { get; set; }

		public DbSet<Order> Orders { get; set; }
		public DbSet<Delivery> Deliveries { get; set; }

		public DbSet<Refund> Refunds { get; set; }

		// Configure relationships between entities
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.Entity<Order>()
				.HasOne(o => o.User)
				.WithMany()
				.HasForeignKey(o => o.UserID)
				.OnDelete(DeleteBehavior.NoAction); 

            modelBuilder.Entity<Order>()
				.HasOne(o => o.Payment)
				.WithMany()
				.HasForeignKey(o => o.PaymentID)
				.OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
				.HasOne(o => o.ShoppingCart)
				.WithMany()
				.HasForeignKey(o => o.ShoppingCartID)
				.OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.ShoppingCart)
                .WithMany()
                .HasForeignKey(p => p.ShoppingCartID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Refund>()
				.HasOne(r => r.User)
				.WithMany()
				.HasForeignKey(r => r.UserID)
				.OnDelete(DeleteBehavior.NoAction); 

			modelBuilder.Entity<Refund>()
				.HasOne(r => r.Order)
				.WithMany()
				.HasForeignKey(r => r.OrderID)
				.OnDelete(DeleteBehavior.NoAction);
		}

	}
}