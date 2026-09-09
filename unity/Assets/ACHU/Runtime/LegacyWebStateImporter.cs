using System;
using UnityEngine;
#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices;
#endif

namespace Achu.BusinessHub
{
    public static class LegacyWebStateImporter
    {
        private const string ImportedFlag = "achu_legacy_web_imported_v1";
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern string AchuReadLegacyState();
#endif
        [Serializable] private class LegacyResources { public double meat, wood, coal, iron; }
        [Serializable] private class LegacyBuildings
        {
            public int furnace,shelter,sawmill,huntersHut,coalMine,ironMine,storehouse,infirmary,embassy,infantryCamp,lancerCamp,marksmanCamp,researchCenter;
        }
        [Serializable] private class LegacyState { public LegacyResources resources; public LegacyBuildings buildings; public int power; }

        public static bool TryImportInto(GameState target)
        {
            if (PlayerPrefs.GetInt(ImportedFlag,0)==1) return false;
#if UNITY_WEBGL && !UNITY_EDITOR
            var json=AchuReadLegacyState();
            if (!string.IsNullOrWhiteSpace(json))
            {
                try
                {
                    var old=JsonUtility.FromJson<LegacyState>(json);
                    if(old?.resources!=null){target.resources.cash=old.resources.meat;target.resources.supplies=old.resources.wood;target.resources.reputation=old.resources.coal;target.resources.talent=old.resources.iron;}
                    if(old?.buildings!=null){
                        target.SetBuildingLevel(AchuIds.Headquarters,old.buildings.furnace);target.SetBuildingLevel(AchuIds.ClientCentre,old.buildings.shelter);
                        target.SetBuildingLevel(AchuIds.SupplyDepot,old.buildings.sawmill);target.SetBuildingLevel(AchuIds.SalesOffice,old.buildings.huntersHut);
                        target.SetBuildingLevel(AchuIds.MarketingStudio,old.buildings.coalMine);target.SetBuildingLevel(AchuIds.RecruitmentHub,old.buildings.ironMine);
                        target.SetBuildingLevel(AchuIds.CentralWarehouse,old.buildings.storehouse);target.SetBuildingLevel(AchuIds.QualityCentre,old.buildings.infirmary);
                        target.SetBuildingLevel(AchuIds.PartnershipOffice,old.buildings.embassy);target.SetBuildingLevel(AchuIds.FieldAcademy,old.buildings.infantryCamp);
                        target.SetBuildingLevel(AchuIds.FleetDepot,old.buildings.lancerCamp);target.SetBuildingLevel(AchuIds.SpecialistUnit,old.buildings.marksmanCamp);
                        target.SetBuildingLevel(AchuIds.InnovationLab,old.buildings.researchCenter);
                    }
                    target.power=Math.Max(target.power,old?.power??0); GameStateStore.Save(target);
                } catch(Exception e){Debug.LogWarning("Legacy ACHU state import failed: "+e.Message);}
            }
#endif
            PlayerPrefs.SetInt(ImportedFlag,1);PlayerPrefs.Save();return true;
        }
    }
}
