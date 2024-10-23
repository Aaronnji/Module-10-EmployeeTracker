import inquirer from 'inquirer';
import pool from './connection.js';

async function getChoices(query, field) {
  try {
    const result = await pool.query(query);
    return result.rows.map(row => ({ name: row[field], value: row.id }));
  } catch (err) {
    console.error('Error fetching choices:', err);
    return [];
  }
}

function mainMenu() {
  inquirer.prompt([
    { type: 'list',
      name: 'choice',
      message: 'What would you like to do?',
      choices: [
        { name: 'View all departments', value: 'viewDepartments' },
        { name: 'View all roles', value: 'viewRoles' },
        { name: 'View all employees', value: 'viewEmployees' },
        { name: 'Add a department', value: 'addDepartment' },
        { name: 'Add a role', value: 'addRole' },
        { name: 'Add an employee', value: 'addEmployee' },
        { name: 'Update an employee role', value: 'updateEmployee' },
        { name: 'Quit', value: 'quit' }
      ]
    }
  ]).then((response) => {
    switch (response.choice) {
      case 'viewDepartments':
        viewDepartments();
        break;
      case 'viewRoles':
        viewRoles();
        break;
      case 'viewEmployees':
        viewEmployees();
        break;
      case 'addDepartment':
        addDepartment();
        break;
      case 'addRole':
        addRole();
        break;
      case 'addEmployee':
        addEmployee();
        break;
      case 'updateEmployee':
        updateEmployeeRole();
        break;
      case 'quit':
        console.log('Quit.');
        pool.end();
        process.exit();
    }
  });
}

function viewDepartments() {
  const query = 'SELECT * FROM department';
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error viewing departments:', err);
      mainMenu();
      return;
    }
    console.table(result.rows);
    mainMenu();
  });
}

function viewRoles() {
  const query = 'SELECT * FROM role';
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error viewing roles:', err);
      mainMenu();
      return;
    }
    console.table(result.rows);
    mainMenu();
  });
}

function viewEmployees() {
  const query = 'SELECT * FROM employee';
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error viewing employees:', err);
      mainMenu();
      return;
    }
    console.table(result.rows);
    mainMenu();
  });
}

async function addDepartment() {
  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the department name:'
    }
  ]);
  const query = 'INSERT INTO department (name) VALUES ($1)';
  pool.query(query, [response.name], (err) => {
    if (err) {
      console.error('Error adding department:', err);
    } else {
      console.log(`Department '${response.name}' added successfully.`);
    }
    mainMenu();
  });
}

async function addRole() {
  const departmentChoices = await getChoices('SELECT id, name FROM department', 'name');
  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the role title:'
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the role salary:'
    },
    {
      type: 'list',
      name: 'departmentId',
      message: 'Select the department:',
      choices: departmentChoices
    }
  ]);

  const query = 'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)';
  pool.query(query, [response.title, response.salary, response.departmentId], (err) => {
    if (err) {
      console.error('Error adding role:', err);
    } else {
      console.log(`Role '${response.title}' added successfully.`);
    }
    mainMenu();
  });
}

async function addEmployee() {
  const roleChoices = await getChoices('SELECT id, title FROM roles', 'title');
  const managerChoices = await getChoices('SELECT id, first_name || \' \' || last_name AS name FROM employees', 'name');

  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: 'Enter employee first name:'
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Enter employee last name:'
    },
    {
      type: 'list',
      name: 'roleId',
      message: 'Select employee role:',
      choices: roleChoices
    },
    {
      type: 'list',
      name: 'managerId',
      message: 'Select manager:',
      choices: managerChoices
    }
  ]);

  const query = 'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
  pool.query(query, [response.firstName, response.lastName, response.roleId, response.managerId], (err) => {
    if (err) {
      console.error('Error adding employee:', err);
    } else {
      console.log(`Employee '${response.firstName} ${response.lastName}' added successfully.`);
    }
    mainMenu();
  });
}

async function updateEmployeeRole() {
  const employeeChoices = await getChoices('SELECT id, first_name || \' \' || last_name AS name FROM employees', 'name');
  const roleChoices = await getChoices('SELECT id, title FROM roles', 'title');

  const response = await inquirer.prompt([
    {
      type: 'list',
      name: 'employeeId',
      message: 'Select the employee:',
      choices: employeeChoices
    },
    {
      type: 'list',
      name: 'newRoleId',
      message: 'Select the new role:',
      choices: roleChoices
    }
  ]);

  const query = 'UPDATE employees SET role_id = $1 WHERE id = $2';
  pool.query(query, [response.newRoleId, response.employeeId], (err) => {
    if (err) {
      console.error('Error updating employee role:', err);
    } else {
      console.log('Employee role updated successfully.');
    }
    mainMenu();
  });
}

mainMenu();