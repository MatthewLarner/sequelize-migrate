#!/usr/bin/env node
var commandLineArgs = require('command-line-args'),
    fs = require('fs-extra'),
    path = require('path'),
    cli = commandLineArgs(
        [
            { name: 'help', alias: 'h', type: Boolean, description: 'Display this help.' },
            { name: 'create', alias: 'c', type: String, description: 'Create a migration with the supplied name' },
            { name: 'up', alias: 'u', type: Boolean, typeLabel: '', description: 'Migrate up to most current migration.' },
            { name: 'down', alias: 'd', type: Boolean, typeLabel: '', description: 'Migrate down one migration.' },
            { name: 'to', alias: 't', type: String, typeLabel: '', description: 'Name of the migration to migrate to.' },
            { name: 'persistence', alias: 'p', type: String, typeLabel: '', description: 'Path to persistence layer, defaults to ../server/persistence' },
            { name: 'config', alias: 'C', type: String, typeLabel: '', description: 'Path to config, defaults to ./config' },
            { name: 'migrations', alias: 'm', type: String, typeLabel: '', description: 'Path to migrations, defaults to ./migrations' }
        ]
    );

function createMigration(name, migrationDir) {
    var time = Date.now(),
        fullName = time.toString() + '-' + name;

    fs.copy(
        path.join(__dirname, '/skeleton.js'),
        path.join(migrationDir, fullName + '.js'),
        function (error) {
            if (error) {
                console.log(error);
                process.exit(1);
            }

            console.log('New migration created: ', fullName);
            process.exit();
        }
    );
}

function showUsage() {
    console.log(
        cli.getUsage({
            title: 'Database migrations',
            description: 'Run migrations against the configured server\'s database.'
        })
    );
}

function migrationCallback(error, migrations) {
    if (error) {
        console.log(error);
        process.exit(1);
    }

    if (migrations.length > 0) {
        console.log('Executed migrations: ', migrations.length);
        migrations.forEach(
            function (migration) {
                console.log(migration.file);
            }
        );

        process.exit();
    }

    console.log('No migrations to execute');
    process.exit();
}

function parseOptions() {
    var options = cli.parse(),
        migrations = options.migrations ? options.migrations : path.join(process.cwd(), './migrations');

    if ((!options.up && !options.down && !options.create) ||
        (options.up && options.down) || options.help) {
        return showUsage();
    }

    if (options.create) {
        return createMigration(options.create, migrations);
    }

    var persistence = options.persistence ? require(options.persistence) : require(path.join(process.cwd(), '../server/persistence')),
        config = options.config ? require(options.config) : require(path.join(process.cwd(), './config')),
        migrate = require('./index');

    if (options.up) {
        return migrate(persistence, config, 'up', migrations, options.to, migrationCallback);
    }

    if (options.down) {
        return migrate(persistence, config, 'down', migrations, options.to, migrationCallback);
    }
}

parseOptions();



