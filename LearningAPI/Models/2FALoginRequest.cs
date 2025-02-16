namespace LearningAPI.Models
{
    public class Verify2FALoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}