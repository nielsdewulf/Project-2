using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Data.SqlClient;
using System.Collections.Generic;
using afloat.models;

namespace afloat
{
    public static class GetTop5Highscores
    {
        [FunctionName("GetTop5Highscores")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scores")] HttpRequest req,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");
            try
            {
                int? top = null;
                if (req.Query.ContainsKey("top"))
                {
                    top = int.Parse(req.Query["top"]);
                }

                using (SqlConnection connection = new SqlConnection())
                {
                    List<Highscore> list = new List<Highscore>();
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"SELECT ";
                        if (top != null)
                        {
                            command.CommandText += $" top @top ";
                            command.Parameters.AddWithValue("@top", top);

                        }

                        command.CommandText += $"* from Leaderboard order by Score desc;";

                        var result = await command.ExecuteReaderAsync();
                        while (await result.ReadAsync())
                        {
                            Highscore score = new Highscore()
                            {
                                PlayerId = Guid.Parse(result["PlayerId"].ToString()),
                                Name = result["Name"].ToString(),
                                GameId = Guid.Parse(result["GameId"].ToString()),
                                Score = int.Parse(result["Score"].ToString()),
                                Avatar = int.Parse(result["Avatar"].ToString())
                            };

                            list.Add(score);
                        }
                    }
                    return new OkObjectResult(list);
                }
            }
            catch (Exception ex)
            {

                log.LogError(ex, "Error at GetTop5Highscores");
                return new StatusCodeResult(500);
            }
        }
    }
}
