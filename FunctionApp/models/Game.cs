using System;

namespace afloat.models
{
    public class Game
    {
        public Guid GameId { get; set; }
        public int PlayerCount { get; set; }
        public int Status { get; set; }
        public DateTime DateTime { get; set; } = DateTime.Now;
        public int MenuId { get; set; }
        public int ModeId { get; set; }


    }
}
