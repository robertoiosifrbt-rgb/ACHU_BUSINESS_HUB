using UnityEngine;

namespace Achu.BusinessHub
{
    public static class GameStateStore
    {
        private const string Key = "achu_unity_state_v1";
        public static GameState Load()
        {
            if (!PlayerPrefs.HasKey(Key)) return GameState.CreateDefault();
            try { return JsonUtility.FromJson<GameState>(PlayerPrefs.GetString(Key)) ?? GameState.CreateDefault(); }
            catch { return GameState.CreateDefault(); }
        }
        public static void Save(GameState state)
        {
            state.Touch(); PlayerPrefs.SetString(Key, JsonUtility.ToJson(state)); PlayerPrefs.Save();
        }
        public static GameState Reset()
        { PlayerPrefs.DeleteKey(Key); PlayerPrefs.Save(); return GameState.CreateDefault(); }
    }
}
