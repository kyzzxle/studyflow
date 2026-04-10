// =============================================
// StudyFlow — User Model
// Represents a registered user account
// =============================================

using System.ComponentModel.DataAnnotations;

namespace StudyFlow.Models
{
    /// <summary>
    /// Represents a registered StudyFlow user.
    /// </summary>
    public class User
    {
        public int Id { get; set; }

        // Full name of the user
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        // Email address (used as login credential)
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
        public string Email { get; set; } = string.Empty;

        // Hashed password (never store plain text)
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string PasswordHash { get; set; } = string.Empty;

        // Date account was created
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
