<?php

namespace Pterodactyl\Repositories\Wings;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Webmozart\Assert\Assert;
use Pterodactyl\Models\Server;
use Pterodactyl\Helpers\TextHighlighter;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\TransferException;
use Pterodactyl\Exceptions\Http\Server\FileSizeTooLargeException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * @method \Pterodactyl\Repositories\Wings\DaemonFileRepository setNode(\Pterodactyl\Models\Node $node)
 * @method \Pterodactyl\Repositories\Wings\DaemonFileRepository setServer(\Pterodactyl\Models\Server $server)
 */
class DaemonFileRepository extends DaemonRepository

{
    /**
     * Return the contents of a given file.
     *
     * @param int|null $notLargerThan the maximum content length in bytes
     *
     * @throws TransferException
     * @throws FileSizeTooLargeException
     * @throws DaemonConnectionException
     */
    public function getContent(string $path, ?int $notLargerThan = null): string
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient()->get(
                sprintf('/api/servers/%s/files/contents', $this->server->uuid),
                [
                    'query' => ['file' => $path],
                ]
            );
        } catch (ClientException|TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }

        $length = (int) Arr::get($response->getHeader('Content-Length'), 0, 0);
        if ($notLargerThan && $length > $notLargerThan) {
            throw new FileSizeTooLargeException();
        }

        return $response->getBody()->__toString();
    }

    /**
     * Save new contents to a given file. This works for both creating and updating
     * a file.
     *
     * @throws DaemonConnectionException
     */
    public function putContent(string $path, string $content): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/write', $this->server->uuid),
                [
                    'query' => ['file' => $path],
                    'body' => $content,
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Return a directory listing for a given path.
     *
     * @throws DaemonConnectionException
     */
    public function getDirectory(string $path): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient()->get(
                sprintf('/api/servers/%s/files/list-directory', $this->server->uuid),
                [
                    'query' => ['directory' => $path],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }

        return json_decode($response->getBody(), true);
    }

     /**
     * Search through files for a given query 
     *
     * @param string $path
     * @param string $query
     * @param int $maxResults Maximum number of results to return (default: 100)
     * @param array $fileExtensions File extensions to search (empty = all files)
     * @param int $maxFileSize Maximum file size to search in bytes (default: 1MB)
     * @return array
     */
    public function searchFiles(string $path, string $query, int $maxResults = 100, array $fileExtensions = [], int $maxFileSize = 1024 * 1024): array
    {
        $results = [];
        $resultCount = 0;
        
        if (strlen(trim($query)) < 2) {
            return $results;
        }

        foreach ($this->getFilesRecursiveGenerator($path, $fileExtensions, $maxFileSize) as $file) {
            if ($resultCount >= $maxResults) {
                break;
            }

            try {
                $matches = $this->searchInFile($file, $query, $maxFileSize);
                
                foreach ($matches as $match) {
                    $results[] = $match;
                    $resultCount++;
                    
                    if ($resultCount >= $maxResults) {
                        break 2;
                    }
                }
            } catch (\Exception $ex) {
                // Skip files that cannot be read
                continue;
            }
        }

        return $results;
    }

    /**
     * Search within a single file for matches.
     * 
     * @param string $filePath
     * @param string $query
     * @param int $maxFileSize
     * @return array
     */
    protected function searchInFile(string $filePath, string $query, int $maxFileSize): array
    {
        $matches = [];
        
        try {
            $content = $this->getContent($filePath, $maxFileSize);
            
            $queryLower = Str::lower($query);
            $lines = explode("\n", $content);
            
            foreach ($lines as $lineNumber => $line) {
                if (Str::contains(Str::lower($line), $queryLower)) {
                    $matches[] = [
                        'file' => $filePath,
                        'line' => $lineNumber + 1,
                        'snippet' => TextHighlighter::highlight($line, $query),
                    ];
                }
            }
        } catch (\Exception $ex) {
            // File couldn't be read, return empty matches
        }
        
        return $matches;
    }

    /**
     * Generator to recursively get files from a directory.
     *
     * @param string $path
     * @param array $allowedExtensions
     * @param int $maxFileSize
     * @return \Generator
     */
    protected function getFilesRecursiveGenerator(string $path, array $allowedExtensions = [], int $maxFileSize = 1024 * 1024): \Generator
    {
        try {
            $entries = $this->getDirectory($path);
        } catch (\Exception $ex) {
            return;
        }

        foreach ($entries as $entry) {
            if ($entry['directory']) {
                yield from $this->getFilesRecursiveGenerator(
                    rtrim($path, '/') . '/' . $entry['name'], 
                    $allowedExtensions, 
                    $maxFileSize
                );
            } else {
                $filePath = rtrim($path, '/') . '/' . $entry['name'];
                
                if (!empty($allowedExtensions)) {
                    $extension = strtolower(pathinfo($entry['name'], PATHINFO_EXTENSION));
                    if (!in_array($extension, $allowedExtensions)) {
                        continue;
                    }
                }
                
                if (isset($entry['size']) && $entry['size'] > $maxFileSize) {
                    continue;
                }
                
                yield $filePath;
            }
        }
    }

    /**
     * Creates a new directory for the server in the given $path.
     *
     * @throws DaemonConnectionException
     */
    public function createDirectory(string $name, string $path): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/create-directory', $this->server->uuid),
                [
                    'json' => [
                        'name' => $name,
                        'path' => $path,
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Renames or moves a file on the remote machine.
     *
     * @throws DaemonConnectionException
     */
    public function renameFiles(?string $root, array $files): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->put(
                sprintf('/api/servers/%s/files/rename', $this->server->uuid),
                [
                    'json' => [
                        'root' => $root ?? '/',
                        'files' => $files,
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Copy a given file and give it a unique name.
     *
     * @throws DaemonConnectionException
     */
    public function copyFile(string $location): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/copy', $this->server->uuid),
                [
                    'json' => [
                        'location' => $location,
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Delete a file or folder for the server.
     *
     * @throws DaemonConnectionException
     */
    public function deleteFiles(?string $root, array $files): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/delete', $this->server->uuid),
                [
                    'json' => [
                        'root' => $root ?? '/',
                        'files' => $files,
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Compress the given files or folders in the given root.
     *
     * @throws DaemonConnectionException
     */
    public function compressFiles(?string $root, array $files): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/compress', $this->server->uuid),
                [
                    'json' => [
                        'root' => $root ?? '/',
                        'files' => $files,
                    ],
                    // Wait for up to 15 minutes for the archive to be completed when calling this endpoint
                    // since it will likely take quite awhile for large directories.
                    'timeout' => 60 * 15,
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }

        return json_decode($response->getBody(), true);
    }

    /**
     * Decompresses a given archive file.
     *
     * @throws DaemonConnectionException
     */
    public function decompressFile(?string $root, string $file): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/decompress', $this->server->uuid),
                [
                    'json' => [
                        'root' => $root ?? '/',
                        'file' => $file,
                    ],
                    // Wait for up to 15 minutes for the decompress to be completed when calling this endpoint
                    // since it will likely take quite awhile for large directories.
                    'timeout' => 60 * 15,
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Chmods the given files.
     *
     * @throws DaemonConnectionException
     */
    public function chmodFiles(?string $root, array $files): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/chmod', $this->server->uuid),
                [
                    'json' => [
                        'root' => $root ?? '/',
                        'files' => $files,
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Pulls a file from the given URL and saves it to the disk.
     *
     * @throws DaemonConnectionException
     */
    public function pull(string $url, ?string $directory, array $params = []): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        $attributes = [
            'url' => $url,
            'root' => $directory ?? '/',
            'file_name' => $params['filename'] ?? null,
            'use_header' => $params['use_header'] ?? null,
            'foreground' => $params['foreground'] ?? null,
        ];

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/files/pull', $this->server->uuid),
                [
                    'json' => array_filter($attributes, fn ($value) => !is_null($value)),
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}
