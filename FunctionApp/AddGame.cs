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
            try
            {
                string connectionString = Environment.GetEnvironmentVariable("AzureSQL");
                string stream = await new StreamReader(req.Body).ReadToEndAsync();
                Game game = JsonConvert.DeserializeObject<Game>(stream);
                game.GameId = Guid.NewGuid();
                using (SqlConnection connection = new SqlConnection())
                {
                    connection.ConnectionString = connectionString;
                    await connection.OpenAsync();
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = $@"SELECT TOP 1 * FROM (
                            SELECT t1.MenuId+1 AS Id
                            FROM (SELECT * from Game where Status = 0) t1
                            WHERE NOT EXISTS(SELECT * FROM (SELECT * from Game where Status = 0) t2 WHERE t2.MenuId = t1.MenuId + 1 )
                            UNION SELECT 1 AS Id WHERE NOT EXISTS (SELECT * FROM (SELECT * from Game where Status = 0) t3 WHERE t3.MenuId = 1)) ot ORDER BY 1";

                        var result = await command.ExecuteReaderAsync();
                        while (await result.ReadAsync())
                        {
                            if (result["Id"] != null && result["Id"] != DBNull.Value)
                                game.MenuId = int.Parse(result["Id"].ToString());
                        }
                        result.Close();
                    }
                    using (SqlCommand command = new SqlCommand())
                    {
                        command.Connection = connection;
                        command.CommandText = $@"insert into Game values(@id,@status,@count,@timestamp,@menuid)";
                        command.Parameters.AddWithValue("@id", game.GameId);
                        command.Parameters.AddWithValue("@count", game.PlayerCount);
                        command.Parameters.AddWithValue("@status", game.Status);
                        command.Parameters.AddWithValue("@timestamp", game.DateTime);
                        command.Parameters.AddWithValue("@menuid", game.MenuId);

                        await command.ExecuteNonQueryAsync();

                    }
                }
                return new OkObjectResult(new Dictionary<string, string>() { { "GameId", game.GameId.ToString() } });

            }
            catch (Exception ex)
            {

                log.LogError("Error at AddGame: " + ex.ToString());
                return new StatusCodeResult(500);
            }
        }
    }
}
