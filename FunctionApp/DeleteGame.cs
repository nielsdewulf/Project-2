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

namespace afloat
{
    public static class DeleteGame
    {
        [FunctionName("DeleteGame")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "game/{GameId}")] HttpRequest req, string GameId,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");
            try
            {
                using (SqlConnection connection = new SqlConnection())
                {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"delete from Leaderboard where GameId = @id;";
                        command.Parameters.AddWithValue("@id", GameId);

                        await command.ExecuteNonQueryAsync();

                    }
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = @"delete from Game where GameId = @id;";
                        command.Parameters.AddWithValue("@id", GameId);

                        await command.ExecuteNonQueryAsync();

                    }
                    return new StatusCodeResult(200);
                }
            }
            catch (Exception ex)
            {

                log.LogError("Error at DeleteGame: " + ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
