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
    public static class GetAllGames
    {
        [FunctionName("GetAllGames")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "game")] HttpRequest req,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");

            try
            {
                int? status = null;
                if (req.Query.ContainsKey("status"))
                    status = int.Parse(req.Query["status"]);
                using (SqlConnection connection = new SqlConnection())
                {
                    List<Game> list = new List<Game>();
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"SELECT * from Game";
                        if (status != null)
                        {
                            command.CommandText += $" where Status = @status";
                            command.Parameters.AddWithValue("@status", status);

                        }
                        var result = await command.ExecuteReaderAsync();
                        while (await result.ReadAsync())
                        {
                            Game game = new Game()
                            {
                                GameId = Guid.Parse(result["GameId"].ToString()),
                                PlayerCount = int.Parse(result["PlayerCount"].ToString()),
                                Status = int.Parse(result["Status"].ToString()),
                                DateTime = DateTime.Parse(result["DateTime"].ToString()),
                                MenuId = int.Parse(result["MenuId"].ToString()),
                                ModeId = int.Parse(result["ModeId"].ToString())

                            };

                            list.Add(game);
                        }
                    }
                    return new OkObjectResult(list);
                }
            }
            catch (Exception ex)
            {

                log.LogError(ex, "Error at GetAllGames");
                return new StatusCodeResult(500);
            }
        }
    }
}
