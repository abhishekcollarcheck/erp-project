// import { sequelize } from "@/config/database";
// import {
//   Model,
//   DataTypes,
//   InferAttributes,
//   InferCreationAttributes,
// } from "sequelize";


// export class EmployeeMonthlyAttendance extends Model<
//   InferAttributes<EmployeeMonthlyAttendance>,
//   InferCreationAttributes<EmployeeMonthlyAttendance>
// > {
//   declare id: number;

//   declare employee_id: number;
//   declare company_id: number;

//   declare year: number;
//   declare month: number;

//   declare total_days: number;
//   declare working_days: number;

//   declare present_days: number;
//   declare absent_days: number;

//   declare weekly_off_days: number;
//   declare holiday_days: number;

//   declare leave_days: number;
//   declare paid_leave_days: number;
//   declare unpaid_leave_days: number;

//   declare half_days: number;
//   declare late_days: number;
//   declare incomplete_days: number;

//   declare total_working_hours: number;
//   declare average_working_hours: number;

//   declare total_punches: number;

//   declare last_calculated_date: string | null;
// }

// EmployeeMonthlyAttendance.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },

//     employee_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     company_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     year: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     month: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     total_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     working_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     present_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     absent_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     weekly_off_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     holiday_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     leave_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     paid_leave_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     unpaid_leave_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     half_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     late_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     incomplete_days: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     total_working_hours: {
//       type: DataTypes.DECIMAL(10, 2),
//       defaultValue: 0,
//     },

//     average_working_hours: {
//       type: DataTypes.DECIMAL(10, 2),
//       defaultValue: 0,
//     },

//     total_punches: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0,
//     },

//     last_calculated_date: {
//       type: DataTypes.DATEONLY,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: "employee_monthly_attendance",

//     indexes: [
//       {
//         unique: true,
//         fields: [
//           "employee_id",
//           "year",
//           "month",
//         ],
//       },
//     ],
//   },
// );


import { sequelize } from "@/config/database";
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class EmployeeMonthlyAttendance extends Model<
  InferAttributes<EmployeeMonthlyAttendance>,
  InferCreationAttributes<EmployeeMonthlyAttendance>
> {
  // FIX: InferCreationAttributes only treats a field as optional-on-create
  // if it's typed CreationOptional<T>. `id` is autoIncrement so Sequelize
  // fills it at runtime, but TS had no way of knowing that — it was
  // demanding `id` on every .create()/.upsert() payload. Same story for
  // every column below that has a `defaultValue`.
  declare id: CreationOptional<number>;

  declare employee_id: number;
  declare company_id: number;

  declare year: number;
  declare month: number;

  declare total_days: CreationOptional<number>;
  declare working_days: CreationOptional<number>;

  declare present_days: CreationOptional<number>;
  declare absent_days: CreationOptional<number>;

  declare weekly_off_days: CreationOptional<number>;
  declare holiday_days: CreationOptional<number>;

  declare leave_days: CreationOptional<number>;
  declare paid_leave_days: CreationOptional<number>;
  declare unpaid_leave_days: CreationOptional<number>;

  // FIX: was DataTypes.INTEGER, but the service does `half_days += 0.5`,
  // producing values like 0.5 / 1.5 / 2.5. Must be a decimal type.
  declare half_days: CreationOptional<number>;

  declare late_days: CreationOptional<number>;
  declare incomplete_days: CreationOptional<number>;

  declare total_working_hours: CreationOptional<number>;
  declare average_working_hours: CreationOptional<number>;

  declare total_punches: CreationOptional<number>;

  declare last_calculated_date: string | null;
}

EmployeeMonthlyAttendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    total_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    working_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    present_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    absent_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    weekly_off_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    holiday_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    leave_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    paid_leave_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    unpaid_leave_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // FIX: half_days can be fractional (e.g. 0.5), was INTEGER before.
    half_days: {
      type: DataTypes.DECIMAL(10, 1),
      defaultValue: 0,
    },

    late_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    incomplete_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    total_working_hours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    average_working_hours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    total_punches: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    last_calculated_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "employee_monthly_attendance",

    indexes: [
      {
        unique: true,
        fields: ["employee_id", "year", "month"],
      },
    ],
  },
);