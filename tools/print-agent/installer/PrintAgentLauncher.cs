using System;
using System.Diagnostics;
using System.IO;

namespace EllstorpsKrog.PrintAgent
{
    internal static class Program
    {
        private static int Main()
        {
            var installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            var nodeExe = Path.Combine(installDir, "node", "node.exe");
            var runScript = Path.Combine(installDir, "run.cjs");

            if (!File.Exists(nodeExe))
            {
                Console.Error.WriteLine("Node runtime missing: " + nodeExe);
                return 1;
            }

            if (!File.Exists(runScript))
            {
                Console.Error.WriteLine("Agent entry missing: " + runScript);
                return 2;
            }

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ELLSTORPS_PRINT_AGENT_HOME")))
            {
                Environment.SetEnvironmentVariable("ELLSTORPS_PRINT_AGENT_HOME", installDir);
            }

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ELLSTORPS_PRINT_AGENT_DATA")))
            {
                var programData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
                var dataDir = Path.Combine(programData, "EllstorpsKrog", "PrintAgent");
                Directory.CreateDirectory(dataDir);
                Environment.SetEnvironmentVariable("ELLSTORPS_PRINT_AGENT_DATA", dataDir);
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = "\"" + runScript + "\"",
                WorkingDirectory = installDir,
                UseShellExecute = false,
            };

            using (var process = Process.Start(startInfo))
            {
                if (process == null)
                {
                    Console.Error.WriteLine("Failed to start print agent process.");
                    return 3;
                }

                process.WaitForExit();
                return process.ExitCode;
            }
        }
    }
}
