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
using System.Collections.Generic;

namespace afloat
{
    public static class AddGame
    {
        [FunctionName("AddGame")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "game")] HttpRequest req,
            ILogger log)
        {
            string connectionString = Environment.GetEnvironmentVariable("AzureSQL");
            string stream = await new StreamReader(req.Body).ReadToEndAsync();
            Game game = JsonConvert.DeserializeObject<Game>(stream);
            game.GameId = Guid.NewGuid();
            try
            {
                using (SqlConnection connection = new SqlConnection())
                {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = $@"insert into Game values(@id,@count,@status,@timestamp);";
                        command.Parameters.AddWithValue("@id", game.GameId);
                        command.Parameters.AddWithValue("@count", game.PlayerCount);
                        command.Parameters.AddWithValue("@status", game.Status);
                        command.Parameters.AddWithValue("@timestamp", game.Timestamp);

                        await command.ExecuteNonQueryAsync();

                    }
                    return new OkObjectResult(new Dictionary<string,string>(){{"GameId",game.GameId.ToString()}});
                }
            }
            catch (Exception ex)
            {

                log.LogError("Error at AddGame: "+ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
