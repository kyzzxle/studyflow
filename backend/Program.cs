// =============================================
// StudyFlow — Program.cs
// ASP.NET Core entry point and service setup
// =============================================

using StudyFlow.Data;

var builder = WebApplication.CreateBuilder(args);

// ---- Register Services ----

// Register TaskService so it can be used in controllers
builder.Services.AddSingleton<TaskService>();

// Add controllers for API endpoints
builder.Services.AddControllers();

// Allow frontend (HTML/JS) to call the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ---- Configure Middleware ----

// Enable CORS
app.UseCors("AllowAll");

// Serve static files (HTML, CSS, JS) from wwwroot folder
app.UseStaticFiles();

// Route requests to controllers
app.UseRouting();
app.MapControllers();

// Open login page by default when visiting localhost:5000
app.MapFallbackToFile("login.html");

app.Run();