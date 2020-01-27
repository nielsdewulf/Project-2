using System;
using System.Data.SqlClient;
using System.IO;
using System.Threading.Tasks;
using afloat.models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace afloat {
    public static class AddHighscore {
        [FunctionName ("AddHighscore")]
        public static async Task<IActionResult> Run (
            [HttpTrigger (AuthorizationLevel.Anonymous, "post", Route = "scores")] HttpRequest req,
            ILogger log) {
            string connectionString = Environment.GetEnvironmentVariable ("AzureSQL");
            string stream = await new StreamReader (req.Body).ReadToEndAsync ();
            Highscore highscore = JsonConvert.DeserializeObject<Highscore> (stream);
            highscore.PlayerId = Guid.NewGuid ();
            if (string.IsNullOrWhiteSpace (highscore.Name) || string.IsNullOrEmpty (highscore.Name)) {
                log.LogError ("Error at AddHighscore: Name cannot be empty or whitespace");
                return new StatusCodeResult (400);
            }
            try {
                using (SqlConnection connection = new SqlConnection ()) {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync ();
                    using (SqlCommand command = new SqlCommand ()) {
                        command.Connection = connection;
                        command.CommandText = $@"insert into Leaderboard values(@id,@name,@gameid,@score,@avatar);";
                        command.Parameters.AddWithValue ("@id", highscore.PlayerId);
                        command.Parameters.AddWithValue ("@name", highscore.Name);
                        if (highscore.GameId != null) {
                            command.Parameters.AddWithValue ("@gameid", highscore.GameId);
                        } else {
                            command.Parameters.AddWithValue ("@gameid", DBNull.Value);
                        }
                        command.Parameters.AddWithValue ("@score", highscore.Score);
                        command.Parameters.AddWithValue ("@avatar", highscore.Avatar);

                        await command.ExecuteNonQueryAsync ();

                    }
                    return new OkResult ();
                }
            } catch (Exception ex) {

                log.LogError ("Error at AddHighscore: " + ex.ToString ());
                return new StatusCodeResult (500);
            }
        }
    }
}