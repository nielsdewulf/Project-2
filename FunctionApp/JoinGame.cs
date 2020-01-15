using System.Collections.Generic;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using afloat.models;
using System.Data.SqlClient;
using System.Text;
using CaseOnline.Azure.WebJobs.Extensions.Mqtt.Messaging;
using CaseOnline.Azure.WebJobs.Extensions.Mqtt;

namespace afloat
{
    public static class JoinGame
    {
        [FunctionName("JoinGame")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "games/{game}/join")] HttpRequest req, string gameid,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");
            string stream = await new StreamReader(req.Body).ReadToEndAsync();
            Dictionary<string, object> obj = JsonConvert.DeserializeObject<Dictionary<string, object>>(stream);

            try
            {
                using (SqlConnection connection = new SqlConnection())
                {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    Game gameObj = new Game();
                    connection.ConnectionString = connectionString;
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"SELECT * from Game where GameId = @gameid";
                        command.Parameters.AddWithValue("@gameid", gameid);
                        var result = await command.ExecuteReaderAsync();
                        while (await result.ReadAsync())
                        {
                            gameObj = new Game()
                            {
                                GameId = Guid.Parse(result["GameId"].ToString()),
                                PlayerCount = int.Parse(result["PlayerCount"].ToString()),
                                Status = int.Parse(result["Status"].ToString()),
                                DateTime = DateTime.Parse(result["DateTime"].ToString()),
                                MenuId = int.Parse(result["MenuId"].ToString()),
                                ModeId = int.Parse(result["ModeId"].ToString())
                            };

                        }
                        result.Close();
                    }
                    if (gameObj.PlayerCount == 2)
                    {
                        return new OkObjectResult(new Dictionary<string, object>() { { "status", "Lobby is full" } });
                    }
                    else
                    {
                        gameObj.PlayerCount++;
                        using (SqlCommand command = new SqlCommand())
                        {
                            command.Connection = connection;

                            command.CommandText = $"update Game set PlayerCount = @playercount where GameId = @id;";
                            command.Parameters.AddWithValue("@id", gameid);
                            command.Parameters.AddWithValue("@playercount", gameObj.PlayerCount);

                            await command.ExecuteNonQueryAsync();

                        }

                        return new OkObjectResult(new Dictionary<string, object>() { { "status", "Ok" } })

                    }
                }
            }
            catch (Exception ex)
            {

                log.LogError("Error at JoinGame: " + ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
