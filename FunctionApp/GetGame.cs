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
using afloat.models;

namespace afloat
{
    public static class GetGame
    {
        [FunctionName("GetGame")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "games/{GameId}")] HttpRequest req, string GameId,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");

            try
            {
                using (SqlConnection connection = new SqlConnection())
                {
                    Game game = new Game();
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"SELECT * from Game where GameId = @gameid";
                        command.Parameters.AddWithValue("@gameid", GameId);
                        var result = await command.ExecuteReaderAsync();
                        while (await result.ReadAsync())
                        {
                            game = new Game()
                            {
                                GameId = Guid.Parse(result["GameId"].ToString()),
                                PlayerCount = int.Parse(result["PlayerCount"].ToString()),
                                Status = int.Parse(result["Status"].ToString()),
                                DateTime = DateTime.Parse(result["DateTime"].ToString()),
                                MenuId = int.Parse(result["MenuId"].ToString()),
                                ModeId = int.Parse(result["ModeId"].ToString())
                            };

                        }
                    }
                    return new OkObjectResult(game);
                }
            }
            catch (Exception ex)
            {

                log.LogError("Error at GetGame: " + ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
