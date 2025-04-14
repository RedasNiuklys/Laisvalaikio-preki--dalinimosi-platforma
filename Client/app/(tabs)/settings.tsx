import React, { useState } from "react";
import { useTheme } from "../../src/context/ThemeContext";
import { View, Text, Button, Switch } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';


export default function SettingsScreen() {
  const { theme, updateTheme, themes } = useTheme();
  const isTwoThemes = Object.keys(themes).length == 2;
  const themeKeys = Object.keys(themes);

  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme.name); // ✅ Store the selected theme

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
      <Text style={{ color: theme.primaryTextColor, fontSize: 24 }}>Settings</Text>
      <Text style={{ color: theme.primaryTextColor, marginTop: 20 }}>Select Theme</Text>
{isTwoThemes ?          
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: theme.primaryTextColor }}>Toggle Light/Dark</Text>
          
          <Switch
            value={theme.name === 'Dark'}
            onValueChange={() => updateTheme(theme.name === 'Dark' ? 'Light' : 'Dark')}
            thumbColor={theme.ctaButtonColor}
          />
        </View>:        
        <DropDownPicker
          open={open}
          value={selectedTheme}
          closeAfterSelecting={true}
          items={themeKeys.map((key) => ({ label: themes[key].name, value: key }))}
          setOpen={setOpen}
          setValue={setSelectedTheme}
          onChangeValue={(value :string | null) => {
            console.log("Changing theme to:", value); // ✅ Debugging log
            updateTheme(value); // ✅ Pass the new value to updateTheme
          }}
        />
  }
    </View>
  );
};