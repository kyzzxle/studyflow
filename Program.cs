// =============================================
// StudyFlow — Program.cs
// ASP.NET Core 7+ entry point and service setup
// =============================================

using StudyFlow.Data;

var builder = WebApplication.CreateBuilder(args);

// ---- Register Services (Dependency Injection) ----

// Register TaskService as a singleton (shared instance across requests)
builder.Services.AddSingleton<TaskService>();

// Add controllers for API endpoints
builder.Services.AddControllers();

// Allow frontend (HTML/JS) to call the API (CORS policy)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Swagger for API documentation (development only)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "StudyFlow API",
        Version = "v1",
        Description = "REST API for the StudyFlow Personal Study Planner"
    });
});

var app = builder.Build();

// ---- Configure Middleware Pipeline ----

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Access at /swagger
}

// Enable CORS
app.UseCors("AllowAll");

// Serve static files (HTML, CSS, JS) from wwwroot folder
app.UseStaticFiles();

// Route requests to controllers
app.UseRouting();
app.MapControllers();

// Redirect root to index.html (login page)
app.MapFallbackToFile("login.html");

app.Run();
