const VictoryConditionSelector = ({ allVictoryConditions, selectedVictoryConditions, onVictoryConditionsChange }) => {
  const handleVictoryConditionToggle = (victoryConditionId, checked) => {
    if (checked) {
      onVictoryConditionsChange([...selectedVictoryConditions, victoryConditionId]);
    } else {
      onVictoryConditionsChange(selectedVictoryConditions.filter(id => id !== victoryConditionId));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">ADD GOAL</h2>
      <div className="space-y-2">
        {allVictoryConditions.map(vc => (
          <label key={vc.victory_condition_id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedVictoryConditions.includes(vc.victory_condition_id)}
              onChange={(e) => handleVictoryConditionToggle(vc.victory_condition_id, e.target.checked)}
            />
            <span className="text-sm">{vc.type} - {vc.description}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default VictoryConditionSelector;

