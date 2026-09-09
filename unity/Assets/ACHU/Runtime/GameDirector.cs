using System;
using UnityEngine;

namespace Achu.BusinessHub
{
    public sealed class GameDirector : MonoBehaviour
    {
        [SerializeField] private float demoSpeed = 120f;
        public GameState State { get; private set; }
        public event Action StateChanged;
        private double saveClock;

        private void Awake()
        {
            State = GameStateStore.Load();
            LegacyWebStateImporter.TryImportInto(State);
            FinishConstructionIfReady();
        }

        private void Update()
        {
            TickProduction(Time.unscaledDeltaTime);
            FinishConstructionIfReady();
            saveClock += Time.unscaledDeltaTime;
            if (saveClock >= 2.0) { saveClock = 0; GameStateStore.Save(State); StateChanged?.Invoke(); }
        }

        private void TickProduction(float dt)
        {
            var scaled = dt * demoSpeed;
            foreach (var id in BuildingCatalog.AllIds)
            {
                var level = State.GetBuildingLevel(id); if (level <= 0) continue;
                var def = BuildingCatalog.Get(id); var amount = BuildingCatalog.ProductionPerSecond(id, level) * scaled;
                switch (def.production)
                {
                    case ResourceKind.Cash: State.resources.cash += amount; break;
                    case ResourceKind.Supplies: State.resources.supplies += amount; break;
                    case ResourceKind.Reputation: State.resources.reputation += amount; break;
                    case ResourceKind.Talent: State.resources.talent += amount; break;
                }
            }
        }

        public bool CanUpgrade(string id, out string reason)
        {
            reason = null; if (State.construction != null) { reason = "Development team is busy"; return false; }
            var d = BuildingCatalog.Get(id); var hq = State.GetBuildingLevel(AchuIds.Headquarters);
            if (id != AchuIds.Headquarters && hq < d.unlockHeadquarters) { reason = $"Headquarters {d.unlockHeadquarters} required"; return false; }
            var target = State.GetBuildingLevel(id) + 1; if (target > 12) { reason = "Max level"; return false; }
            var c = BuildingCatalog.CostAt(id,target);
            if (State.resources.cash<c.cash||State.resources.supplies<c.supplies||State.resources.reputation<c.reputation||State.resources.talent<c.talent)
            { reason = "Not enough resources"; return false; }
            return true;
        }

        public bool TryUpgrade(string id)
        {
            if (!CanUpgrade(id,out _)) return false;
            var target=State.GetBuildingLevel(id)+1; var c=BuildingCatalog.CostAt(id,target);
            State.resources.cash-=c.cash; State.resources.supplies-=c.supplies; State.resources.reputation-=c.reputation; State.resources.talent-=c.talent;
            var realSeconds=Math.Max(0.5,BuildingCatalog.SecondsAt(id,target)/demoSpeed);
            State.construction=new ConstructionState{buildingId=id,targetLevel=target,finishAtUnixMs=DateTimeOffset.UtcNow.AddSeconds(realSeconds).ToUnixTimeMilliseconds()};
            GameStateStore.Save(State); StateChanged?.Invoke(); return true;
        }

        private void FinishConstructionIfReady()
        {
            var c=State?.construction; if(c==null||DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()<c.finishAtUnixMs)return;
            State.SetBuildingLevel(c.buildingId,c.targetLevel); State.power += BuildingCatalog.PowerAt(c.buildingId,c.targetLevel); State.construction=null;
            GameStateStore.Save(State); StateChanged?.Invoke();
        }

        public void ResetProgress()
        { State=GameStateStore.Reset(); StateChanged?.Invoke(); }
    }
}
