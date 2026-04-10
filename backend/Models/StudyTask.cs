// =============================================
// StudyFlow — StudyTask Model
// Represents a single study task/reminder
// =============================================

using System;
using System.ComponentModel.DataAnnotations;

namespace StudyFlow.Models
{
    /// <summary>
    /// Represents a study task with scheduling and reminder information.
    /// </summary>
    public class StudyTask
    {
        // Unique identifier for the task
        public int Id { get; set; }

        // The user who owns this task
        [Required]
        public int UserId { get; set; }

        // Title of the task (required, min 3 chars)
        [Required(ErrorMessage = "Task title is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 100 characters.")]
        public string Title { get; set; } = string.Empty;

        // Academic subject (e.g., Math, English)
        [Required(ErrorMessage = "Subject is required.")]
        [StringLength(50, ErrorMessage = "Subject cannot exceed 50 characters.")]
        public string Subject { get; set; } = string.Empty;

        // Optional description/notes
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        // Due date of the task
        [Required(ErrorMessage = "Due date is required.")]
        [DataType(DataType.Date)]
        public DateTime DueDate { get; set; }

        // Optional reminder time (HH:mm format)
        public string? ReminderTime { get; set; }

        // Priority level: Low, Medium, High
        [Required]
        public string Priority { get; set; } = "Medium";

        // Current status: Pending, In Progress, Done
        [Required]
        public string Status { get; set; } = "Pending";

        // When the task was created
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
