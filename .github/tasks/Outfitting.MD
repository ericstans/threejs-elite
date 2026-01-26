Implement the "Outfitting" service screen. Style it similarly to the existing services menus (jobs and commodities). 

First we need to introduce the concept of ship equipment. Equipment includes:
+ Weapons
+ Thrusters
+ (Other types, but we will not implement those yet)

The only weapons we will have available for now are lasers. The current laser that the player starts with should be called "Laser 1". 
Create a WEAPON_DEFINITIONS in the constants folder and include:
- Name
- Description (flavor text)
- Damage
- Base Cost
- Velocity
- Type (always LASER for now)
- Color
Use the existing values for Laser 1 and generate sensible values for Laser 2, Laser 3 and Laser 4.

Next, create a THRUSTER_DEFINITIONS in the constants folder and include:
- Name
- Description (flavor text)
- Thrust
The player's current thruster should be called "Thruster 1". Generate sensible values for "Thruster 2" and "Thruster 3". 

(NOTE: The Target panel currently shows "LASER". This will stay the same, as it should reference the equipped weapon TYPE).

Once this is in place, create the Outfitting service screen. 