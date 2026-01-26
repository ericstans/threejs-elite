Implement the "Outfitting" service screen. Style it similarly to the existing services menus (jobs and commodities). 

* Context
First we need to introduce the concept of ship equipment. Equipment includes:
    + Weapons
    + Hulls
    + Thrusters
    + (Other types, but we will not implement those yet)
Refer to ShipEquipmentData.js


* Create the Outfitting service screen. 
On the left side it should show equipment for sale. On the right side it should show what the player currently has equipped.
Sell price is 33% of buy price.
For now, any station with the Outfitting service should sell every type of equipment.

Finally:
* Add logic to the procedural generation so most planets with services will have outfitting.
