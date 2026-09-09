using System;
using System.Collections.Generic;

namespace Achu.BusinessHub
{
    public enum ResourceKind { Cash, Supplies, Reputation, Talent, None }

    public readonly struct ResourceCost
    {
        public readonly double cash, supplies, reputation, talent;
        public ResourceCost(double cash, double supplies, double reputation, double talent)
        { this.cash = cash; this.supplies = supplies; this.reputation = reputation; this.talent = talent; }
    }

    public sealed class BuildingDef
    {
        public string id, name, role;
        public int unlockHeadquarters;
        public ResourceCost baseCost;
        public double costRate;
        public double baseSeconds;
        public double timeRate;
        public int basePower;
        public double powerRate;
        public ResourceKind production;
        public double productionBase;
    }

    public static class BuildingCatalog
    {
        public static readonly string[] AllIds =
        {
            AchuIds.Headquarters, AchuIds.ClientCentre, AchuIds.SupplyDepot, AchuIds.SalesOffice,
            AchuIds.MarketingStudio, AchuIds.CentralWarehouse, AchuIds.FieldAcademy, AchuIds.QualityCentre,
            AchuIds.RecruitmentHub, AchuIds.FleetDepot, AchuIds.PartnershipOffice, AchuIds.SpecialistUnit,
            AchuIds.InnovationLab
        };

        private static readonly Dictionary<string, BuildingDef> Defs = new()
        {
            [AchuIds.Headquarters] = D(AchuIds.Headquarters,"Headquarters","Controls company size and unlocks new divisions, systems and markets.",1,72,90,12,0,1.48,30,1.5,160,1.55),
            [AchuIds.ClientCentre] = D(AchuIds.ClientCentre,"Client Centre","Organises client relationships and recurring service capacity.",1,24,38,2,0,1.42,22,1.45,70,1.50),
            [AchuIds.SupplyDepot] = D(AchuIds.SupplyDepot,"Supply Depot","Keeps equipment, consumables and field teams supplied.",1,30,44,3,0,1.44,28,1.48,82,1.52,ResourceKind.Supplies,2.4),
            [AchuIds.SalesOffice] = D(AchuIds.SalesOffice,"Sales Office","Generates revenue opportunities and grows the sales pipeline.",2,38,52,3,0,1.45,31,1.49,90,1.53,ResourceKind.Cash,2.7),
            [AchuIds.MarketingStudio] = D(AchuIds.MarketingStudio,"Marketing Studio","Builds brand awareness, reviews and market reputation.",3,44,58,4,0,1.47,36,1.50,104,1.54,ResourceKind.Reputation,1.35),
            [AchuIds.CentralWarehouse] = D(AchuIds.CentralWarehouse,"Central Warehouse","Raises stock capacity and protects operating reserves.",3,46,70,8,0,1.46,39,1.50,112,1.54),
            [AchuIds.FieldAcademy] = D(AchuIds.FieldAcademy,"Field Academy","Recruits and develops frontline field service teams.",5,68,74,10,0,1.49,50,1.52,135,1.57),
            [AchuIds.QualityCentre] = D(AchuIds.QualityCentre,"Quality Centre","Improves service quality, issue resolution and client retention.",5,56,64,8,0,1.47,42,1.50,122,1.55),
            [AchuIds.RecruitmentHub] = D(AchuIds.RecruitmentHub,"Recruitment Hub","Builds the candidate pipeline and generates Talent.",6,66,84,16,0,1.50,48,1.53,142,1.57,ResourceKind.Talent,.55),
            [AchuIds.FleetDepot] = D(AchuIds.FleetDepot,"Fleet Depot","Expands mobile operating capacity and dispatch coverage.",6,76,80,12,3,1.50,52,1.53,148,1.58),
            [AchuIds.PartnershipOffice] = D(AchuIds.PartnershipOffice,"Partnership Office","Builds the partner network and shared operating capacity.",7,62,70,10,2,1.48,48,1.51,128,1.56),
            [AchuIds.SpecialistUnit] = D(AchuIds.SpecialistUnit,"Specialist Unit","Develops teams for premium and complex services.",8,74,84,13,3,1.50,54,1.53,152,1.58),
            [AchuIds.InnovationLab] = D(AchuIds.InnovationLab,"Innovation Lab","Improves automation, data and company-wide efficiency.",9,82,98,18,5,1.52,65,1.55,180,1.60)
        };

        private static BuildingDef D(string id,string name,string role,int unlock,double cash,double supplies,double rep,double talent,double costRate,double seconds,double timeRate,int power,double powerRate,ResourceKind prod=ResourceKind.None,double prodBase=0)
            => new() { id=id,name=name,role=role,unlockHeadquarters=unlock,baseCost=new ResourceCost(cash,supplies,rep,talent),costRate=costRate,baseSeconds=seconds,timeRate=timeRate,basePower=power,powerRate=powerRate,production=prod,productionBase=prodBase };

        public static BuildingDef Get(string id) => Defs[id];
        public static ResourceCost CostAt(string id, int targetLevel)
        {
            var d = Get(id); var m = Math.Pow(d.costRate, Math.Max(0,targetLevel-1));
            return new ResourceCost(Math.Round(d.baseCost.cash*m),Math.Round(d.baseCost.supplies*m),Math.Round(d.baseCost.reputation*m),Math.Round(d.baseCost.talent*m));
        }
        public static double SecondsAt(string id, int targetLevel)
        { var d=Get(id); return Math.Round(d.baseSeconds*Math.Pow(d.timeRate,Math.Max(0,targetLevel-1))); }
        public static int PowerAt(string id, int targetLevel)
        { var d=Get(id); return (int)Math.Round(d.basePower*Math.Pow(d.powerRate,Math.Max(0,targetLevel-1))); }
        public static double ProductionPerSecond(string id, int level)
        {
            var d=Get(id); if(level<=0||d.production==ResourceKind.None)return 0;
            return d.productionBase*level*Math.Pow(1.10,Math.Max(0,level-1));
        }
    }
}
