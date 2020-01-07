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
using System.Reflection;
using System.Linq;
using System.Collections.Generic;

namespace afloat
{
    public static class ChangeGame
    {
        [FunctionName("ChangeGame")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "game/{GameId}")] HttpRequest req,string GameId,
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
                        List<PropertyInfo> dict = game.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public).ToList();
                        string toChange = "";

                        foreach (PropertyInfo entry in dict) //registration
                        {
                            if (!entry.CanRead) continue;
                            object val = entry.GetValue(game, null);
                            if (val == null || entry.Name == "Timestamp" || entry.Name == "GameId") continue;
                            toChange += $"{entry.Name}=@{entry.Name},";
                            command.Parameters.AddWithValue($"@{entry.Name}", val);

                        }
                        command.CommandText = $"update Game set {toChange.Remove(toChange.Length - 1)} where GameId = @id;";
                        command.Parameters.AddWithValue("@id", GameId);

                        await command.ExecuteNonQueryAsync();

                    }
                    return new OkResult();
                }
            }
            catch (Exception ex)
            {

                log.LogError("Error at ChangeGame: "+ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
