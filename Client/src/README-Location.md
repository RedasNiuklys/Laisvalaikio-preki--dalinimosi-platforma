# Location Entity Integration

This document provides instructions for integrating the Location entity into your application.

## Files Created

1. **Types**

   - `Client/src/types/Location.ts` - Contains the Location and LocationFormData interfaces

2. **API**

   - `Client/src/api/locationApi.ts` - Contains API functions for CRUD operations on locations
   - `Client/src/utils/authUtils.ts` - Contains utility functions for authentication

3. **Screens**

   - `Client/src/pages/LocationListScreen.tsx` - Screen for displaying a list of locations
   - `Client/src/pages/LocationFormScreen.tsx` - Screen for adding and editing locations

4. **Navigation**
   - `Client/src/navigation/LocationRoutes.ts` - Contains route constants and screen mappings

## Integration Steps

### 1. Add Location to Navigation

Add the Location screens to your main navigation stack:

```typescript
// In your main navigation file (e.g., App.tsx or a dedicated navigation file)
import { LOCATION_ROUTES, LOCATION_SCREENS } from './src/navigation/LocationRoutes';

// Add to your Stack.Navigator
<Stack.Screen
  name={LOCATION_ROUTES.LOCATION_LIST}
  component={LOCATION_SCREENS[LOCATION_ROUTES.LOCATION_LIST]}
  options={{ title: 'Locations' }}
/>
<Stack.Screen
  name={LOCATION_ROUTES.ADD_LOCATION}
  component={LOCATION_SCREENS[LOCATION_ROUTES.ADD_LOCATION]}
  options={{ title: 'Add Location' }}
/>
<Stack.Screen
  name={LOCATION_ROUTES.EDIT_LOCATION}
  component={LOCATION_SCREENS[LOCATION_ROUTES.EDIT_LOCATION]}
  options={{ title: 'Edit Location' }}
/>
```

### 2. Add a Link to Locations in Your Menu or Home Screen

Add a button or link to navigate to the Locations screen:

```typescript
import { LOCATION_ROUTES } from "./src/navigation/LocationRoutes";

// In your component
<Button
  onPress={() => navigation.navigate(LOCATION_ROUTES.LOCATION_LIST)}
  title="Locations"
/>;
```

### 3. Backend API Implementation

Ensure your backend API implements the following endpoints:

- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get a specific location
- `POST /api/locations` - Create a new location
- `PUT /api/locations/:id` - Update a location
- `DELETE /api/locations/:id` - Delete a location

The request/response format should match the interfaces defined in `Location.ts`.

## Usage

- To view all locations, navigate to the LocationList screen
- To add a new location, tap the FAB button on the LocationList screen
- To edit a location, tap the edit icon on a location card
- To delete a location, tap the delete icon on a location card

## Future Enhancements

1. **Map Integration** - Add a map view to display locations geographically
2. **Search and Filter** - Add search and filter functionality for locations
3. **Location Sharing** - Allow users to share locations with other users
4. **Favorites** - Allow users to mark locations as favorites
