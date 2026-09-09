using System;
using System.Collections.Generic;
using UnityEngine;

namespace Achu.BusinessHub
{
    [Serializable]
    public sealed class ResourceState
    {
        public double cash = 900;
        public double supplies = 1000;
        public double reputation = 180;
        public double talent = 35;
    }

    [Serializable]
    public sealed class BuildingLevel
    {
        public string id;
        public int level;
        public BuildingLevel(string id, int level) { this.id = id; this.level = level; }
    }

    [Serializable]
    public sealed class TroopState
    {
        public int cleaners = 12;
        public int mobileCleaners;
        public int specialists;
    }

    [Serializable]
    public sealed class WorldState
    {
        public List<string> scouted = new() { "10,10" };
        public List<string> owned = new() { "10,10" };
        public List<string> defeated = new();
        public TroopState troops = new();
    }

    [Serializable]
    public sealed class ConstructionState
    {
        public string buildingId;
        public int targetLevel;
        public long finishAtUnixMs;
    }

    [Serializable]
    public sealed class GameState
    {
        public string playerId;
        public ResourceState resources = new();
        public List<BuildingLevel> buildings = new();
        public WorldState world = new();
        public ConstructionState construction;
        public int power = 190;
        public long lastSavedAtUnixMs;

        public static GameState CreateDefault()
        {
            var id = Guid.NewGuid().ToString("N");
            var s = new GameState { playerId = "p" + id.Substring(0,9) };
            foreach (var buildingId in BuildingCatalog.AllIds)
                s.buildings.Add(new BuildingLevel(buildingId, buildingId == AchuIds.Headquarters ? 1 : 0));
            s.Touch();
            return s;
        }

        public int GetBuildingLevel(string id)
        {
            var row = buildings.Find(x => x.id == id);
            return row?.level ?? 0;
        }

        public void SetBuildingLevel(string id, int level)
        {
            var row = buildings.Find(x => x.id == id);
            if (row == null) buildings.Add(new BuildingLevel(id, level));
            else row.level = level;
        }

        public void Touch() => lastSavedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
}
