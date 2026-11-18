# How regular user works

Behavior for regular user is dependent on the context and data.

We are talking about Welcome section on Home screen.

Of course, if user has some admin functions, she will see the buttons in Admin section. 
And there is still that right panel with details of the user.

## When user is not member yet

Then she sees only an invitation to become member.

## When user is a member

Then she will see

* list of seasons which are opened
  * either when user is not enrolled - then she can enrol
  * or she is enrolled - then she can proceed to the unit selection and create allocation
    * user can create only one allocation
    * but admin in backend can allocate further units to the same member
* list of allocations for opened or reserved seasons
  * it shows the payment info
  * it allows to cancel allocation
    * canceled allocations are listed, but they can't be uncancelled
  * allocations for the seasons in preparation or closed are not shown

## Unit selection and allocation

Screen shows the location layout, units have different color - those not enrolled to the season, those already allocated to another user (only non-cancelled allocations considered) and those available for allocation

Available units are clickable, but only one unit. 

Once clicked, unit can be allocated to the current user, in pending status.

## Payment screen

It shows payment info:

* Account number, bank info (coming from Location properties)
* Variable symbol (comes from allocation details)
* Price to pay

* QR code to do the payment via Czech QR code standard
https://share.google/aimode/ELZpZVKGyhT9dEgbH

## Focused mode

User is allowed to proceed in steps:

* when enrolled, it goes directly to allocation screen
* when allocated, it goes directly to payment info screen

