using System;
using System.Data.SqlClient;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace afloat {
    public static class clearLeaderboard {
        [FunctionName ("clearLeaderboard")]
        public static async Task<IActionResult> Run (
            [HttpTrigger (AuthorizationLevel.Anonymous, "get", Route = "/scores/clear")] HttpRequest req,
            ILogger log) {
            try {
                string connectionString = Environment.GetEnvironmentVariable ("AzureSQL");

                using (SqlConnection connection = new SqlConnection ()) {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync ();

                    using (SqlCommand command = new SqlCommand ()) {
                        command.Connection = connection;
                        command.CommandText = @"truncate table Leaderboard;";

                        await command.ExecuteNonQueryAsync ();

                    }
                }
                return new StatusCodeResult (200);

            } catch (Exception ex) {

                log.LogError ("Error at clearLeaderboard: " + ex.ToString ());
                return new StatusCodeResult (500);
            }
        }
    }
}