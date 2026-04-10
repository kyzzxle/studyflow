// =============================================
// StudyFlow — TasksController
// REST API endpoints for task management
// =============================================

using Microsoft.AspNetCore.Mvc;
using StudyFlow.Data;
using StudyFlow.Models;

namespace StudyFlow.Controllers
{
    /// <summary>
    /// API Controller for StudyTask CRUD operations.
    /// Base route: /api/tasks
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly TaskService _taskService;

        // Constructor injection of TaskService (Dependency Injection)
        public TasksController(TaskService taskService)
        {
            _taskService = taskService;
        }

        // ---- GET /api/tasks/{userId} ----
        /// <summary>Get all tasks for a specific user</summary>
        [HttpGet("{userId}")]
        public IActionResult GetTasks(int userId)
        {
            // Validate userId
            if (userId <= 0)
                return BadRequest(new { error = "Invalid user ID." });

            var tasks = _taskService.GetTasksByUser(userId);
            return Ok(tasks);
        }

        // ---- GET /api/tasks/{userId}/summary ----
        /// <summary>Get task status summary for progress charts</summary>
        [HttpGet("{userId}/summary")]
        public IActionResult GetSummary(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { error = "Invalid user ID." });

            var summary = _taskService.GetStatusSummary(userId);
            return Ok(summary);
        }

        // ---- GET /api/tasks/{userId}/today ----
        /// <summary>Get today's tasks for reminders</summary>
        [HttpGet("{userId}/today")]
        public IActionResult GetTodaysTasks(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { error = "Invalid user ID." });

            var tasks = _taskService.GetTodaysTasks(userId);
            return Ok(tasks);
        }

        // ---- GET /api/tasks/{userId}/overdue ----
        /// <summary>Get overdue tasks</summary>
        [HttpGet("{userId}/overdue")]
        public IActionResult GetOverdueTasks(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { error = "Invalid user ID." });

            var tasks = _taskService.GetOverdueTasks(userId);
            return Ok(tasks);
        }

        // ---- POST /api/tasks ----
        /// <summary>Create a new task</summary>
        [HttpPost]
        public IActionResult CreateTask([FromBody] StudyTask task)
        {
            // Check if request body is valid (model binding)
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = _taskService.AddTask(task);
                // Return 201 Created with location header
                return CreatedAtAction(nameof(GetTasks), new { userId = task.UserId }, created);
            }
            catch (ArgumentException ex)
            {
                // Validation error from service layer
                return BadRequest(new { error = ex.Message });
            }
        }

        // ---- PUT /api/tasks/{taskId} ----
        /// <summary>Update an existing task</summary>
        [HttpPut("{taskId}")]
        public IActionResult UpdateTask(int taskId, [FromBody] StudyTask task)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (taskId <= 0)
                return BadRequest(new { error = "Invalid task ID." });

            try
            {
                var updated = _taskService.UpdateTask(taskId, task.UserId, task);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // ---- DELETE /api/tasks/{taskId}/{userId} ----
        /// <summary>Delete a task</summary>
        [HttpDelete("{taskId}/{userId}")]
        public IActionResult DeleteTask(int taskId, int userId)
        {
            if (taskId <= 0 || userId <= 0)
                return BadRequest(new { error = "Invalid task or user ID." });

            bool deleted = _taskService.DeleteTask(taskId, userId);

            if (!deleted)
                return NotFound(new { error = $"Task {taskId} not found." });

            // Return 204 No Content on successful deletion
            return NoContent();
        }
    }
}
