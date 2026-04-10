// =============================================
// StudyFlow — TaskService
// Business logic for study task operations
// =============================================

using System;
using System.Collections.Generic;
using System.Linq;
using StudyFlow.Models;

namespace StudyFlow.Data
{
    /// <summary>
    /// Handles all CRUD operations and business logic for StudyTask.
    /// In production, this would use a real database (e.g., Entity Framework + SQL Server).
    /// </summary>
    public class TaskService
    {
        // In-memory data store (simulates a database for demo purposes)
        private static List<StudyTask> _tasks = new List<StudyTask>();
        private static int _nextId = 1;

        /// <summary>
        /// Gets all tasks belonging to a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <returns>List of tasks for the user</returns>
        public List<StudyTask> GetTasksByUser(int userId)
        {
            return _tasks
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.DueDate)
                .ToList();
        }

        /// <summary>
        /// Gets a single task by ID, verifying it belongs to the user.
        /// </summary>
        public StudyTask? GetTaskById(int taskId, int userId)
        {
            return _tasks.FirstOrDefault(t => t.Id == taskId && t.UserId == userId);
        }

        /// <summary>
        /// Adds a new task after validating all input fields.
        /// </summary>
        /// <returns>The created task, or throws ValidationException on invalid input</returns>
        public StudyTask AddTask(StudyTask task)
        {
            // Validate input fields
            ValidateTask(task);

            // Assign ID and timestamps
            task.Id = _nextId++;
            task.CreatedAt = DateTime.Now;

            // Normalize status and priority
            task.Status = NormalizeStatus(task.Status);
            task.Priority = NormalizePriority(task.Priority);

            _tasks.Add(task);
            return task;
        }

        /// <summary>
        /// Updates an existing task with validated new data.
        /// </summary>
        public StudyTask UpdateTask(int taskId, int userId, StudyTask updated)
        {
            var existing = GetTaskById(taskId, userId);
            if (existing == null)
                throw new KeyNotFoundException($"Task with ID {taskId} not found.");

            // Validate updated fields
            ValidateTask(updated);

            // Apply updates
            existing.Title        = updated.Title;
            existing.Subject      = updated.Subject;
            existing.Description  = updated.Description;
            existing.DueDate      = updated.DueDate;
            existing.ReminderTime = updated.ReminderTime;
            existing.Priority     = NormalizePriority(updated.Priority);
            existing.Status       = NormalizeStatus(updated.Status);

            return existing;
        }

        /// <summary>
        /// Deletes a task by ID, verifying ownership.
        /// </summary>
        /// <returns>True if deleted, false if not found</returns>
        public bool DeleteTask(int taskId, int userId)
        {
            var task = GetTaskById(taskId, userId);
            if (task == null) return false;

            _tasks.Remove(task);
            return true;
        }

        /// <summary>
        /// Gets tasks due today for a user (used for reminders).
        /// </summary>
        public List<StudyTask> GetTodaysTasks(int userId)
        {
            var today = DateTime.Today;
            return _tasks
                .Where(t => t.UserId == userId && t.DueDate.Date == today && t.Status != "Done")
                .ToList();
        }

        /// <summary>
        /// Gets overdue tasks for a user (due date passed, not Done).
        /// </summary>
        public List<StudyTask> GetOverdueTasks(int userId)
        {
            var today = DateTime.Today;
            return _tasks
                .Where(t => t.UserId == userId && t.DueDate.Date < today && t.Status != "Done")
                .OrderBy(t => t.DueDate)
                .ToList();
        }

        /// <summary>
        /// Gets tasks grouped by status for progress charts.
        /// </summary>
        public Dictionary<string, int> GetStatusSummary(int userId)
        {
            var userTasks = GetTasksByUser(userId);
            return new Dictionary<string, int>
            {
                { "Pending",     userTasks.Count(t => t.Status == "Pending") },
                { "In Progress", userTasks.Count(t => t.Status == "In Progress") },
                { "Done",        userTasks.Count(t => t.Status == "Done") }
            };
        }

        // ---- Private Validation Methods ----

        /// <summary>
        /// Validates all required fields of a task.
        /// Throws ArgumentException if any field is invalid.
        /// </summary>
        private void ValidateTask(StudyTask task)
        {
            // Title validation
            if (string.IsNullOrWhiteSpace(task.Title))
                throw new ArgumentException("Task title is required.");

            if (task.Title.Trim().Length < 3)
                throw new ArgumentException("Task title must be at least 3 characters.");

            if (task.Title.Length > 100)
                throw new ArgumentException("Task title cannot exceed 100 characters.");

            // Subject validation
            if (string.IsNullOrWhiteSpace(task.Subject))
                throw new ArgumentException("Subject is required.");

            if (task.Subject.Length > 50)
                throw new ArgumentException("Subject cannot exceed 50 characters.");

            // Due date validation
            if (task.DueDate == default)
                throw new ArgumentException("Due date is required.");

            // Reminder time format validation (HH:mm)
            if (!string.IsNullOrEmpty(task.ReminderTime))
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(task.ReminderTime, @"^\d{2}:\d{2}$"))
                    throw new ArgumentException("Reminder time must be in HH:mm format.");
            }

            // Priority validation
            string[] validPriorities = { "Low", "Medium", "High" };
            if (!validPriorities.Contains(task.Priority))
                throw new ArgumentException("Priority must be Low, Medium, or High.");

            // Status validation
            string[] validStatuses = { "Pending", "In Progress", "Done" };
            if (!validStatuses.Contains(task.Status))
                throw new ArgumentException("Status must be Pending, In Progress, or Done.");
        }

        /// <summary>Normalizes status string to expected format.</summary>
        private string NormalizeStatus(string status)
        {
            return status?.Trim() switch
            {
                "pending"     => "Pending",
                "in progress" => "In Progress",
                "done"        => "Done",
                _             => status ?? "Pending"
            };
        }

        /// <summary>Normalizes priority string to expected format.</summary>
        private string NormalizePriority(string priority)
        {
            return priority?.Trim() switch
            {
                "low"    => "Low",
                "medium" => "Medium",
                "high"   => "High",
                _        => priority ?? "Medium"
            };
        }
    }
}
