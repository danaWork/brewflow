# Inventory & Menu Integration Verification Guide

This guide helps you verify the recent updates to the Inventory System and its integration into the Menu Management flow.

## 1. Inventory Dashboard Theme

**URL:** `/owner/inventory`

- **Visual Check:**
  - Verify that the page titles and buttons use the new Orange (`#D95D1E`) theme.
  - Check that the "Add Item" modal uses rounded corners (`rounded-3xl` / `rounded-2xl`).
  - Check that the Inventory List table has rounded corners and orange focus rings on inputs when editing.

- **Functional Check:**
  - **Add Item:** Click "Add Item" and create a test item (e.g., "Test Milk", Qty: 100, Unit: ml).
  - **Edit Item:** Click the edit icon on a row, change the quantity, and click the checkmark.
  - **Delete Item:** Delete the test item if needed.

## 2. Menu Management Integration

**URL:** `/owner/menu-categories`

- **Visual Check:**
  - Open any Category (e.g., "Signature Coffees").
  - Click **"Add Product"** or the **Edit (Pencil)** icon on an existing product.
  - **Product Modal:** Scroll to the bottom of the modal. You should see a new section titled **"RECIPE / INGREDIENTS"** below the "Linked Modifiers" section.

- **Functional Check:**
  - **Link Ingredient:**
    - In the "Recipe / Ingredients" section, click **"Add Ingredient"**.
    - Select an inventory item (e.g., "Milk") from the dropdown.
    - Enter a quantity (e.g., "200").
    - Click **"Save Product"**.
  - **Verify Persistence:**
    - Re-open the same product.
    - Verify that the ingredient and quantity are still listed.
  - **Verify Frontend Logic:**
    - If you add an ingredient that puts a product "Out of Stock" (i.e., required > available), check the Customer Menu to see if the product shows as "Out of Stock". (Note: The backend logic for this was implemented in previous steps, this verifies the link is working).

## 3. Cleanup (Optional)

- The previous "Product Recipe Editor" page at `/owner/menu-management/edit/[id]` might now be redundant. If you are satisfied with the modal integration, you may verify if that route is still needed for any specific advanced editing, but the core "Recipe" feature is now centralized in the Menu Management modal.
