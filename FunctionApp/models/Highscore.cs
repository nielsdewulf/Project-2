using System;

namespace afloat.models
{
    public class Highscore
    {
        public Guid PlayerId { get; set; }
        public string Name { get; set; }
        public Guid? GameId { get; set; }
        public int Score { get; set; }
        public int Avatar { get; set; }
    }
}
